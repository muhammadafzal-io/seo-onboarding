// lib/ga/client.ts
// Google Analytics Data API v1 client
// Uses service account credentials stored per client in Supabase
// Handles token refresh, caching, and quota-safe retries

import { ChannelBreakdown, DateRange, DeviceSplit, GeoRow, TopPage, TrafficOverview, TrendPoint } from "../types/analytics";


const GA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

// ── Token cache (in-process; use Redis in production) ─────────
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

// ── Get OAuth2 access token from service account credentials ──
export async function getAccessToken(credentialsJson: string): Promise<string> {
  const creds = JSON.parse(credentialsJson)
  const cacheKey = creds.client_email

  // Return cached token if still valid (with 60s buffer)
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token
  }

  // Build JWT assertion for service account
  const now   = Math.floor(Date.now() / 1000)
  const claim = {
    iss:   creds.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud:   TOKEN_ENDPOINT,
    exp:   now + 3600,
    iat:   now,
  }

  // Sign JWT with RSA private key using Web Crypto API (edge-compatible)
  const jwt = await signJwt(claim, creds.private_key)

  const res = await fetch(TOKEN_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA token fetch failed: ${err}`)
  }

  const { access_token, expires_in } = await res.json()

  tokenCache.set(cacheKey, {
    token:     access_token,
    expiresAt: Date.now() + expires_in * 1000,
  })

  return access_token
}

// ── JWT signing (RSA-SHA256, Web Crypto) ──────────────────────
async function signJwt(
  payload: Record<string, unknown>,
  pemKey:  string
): Promise<string> {
  const header  = { alg: 'RS256', typ: 'JWT' }
  const b64hdr  = btoa(JSON.stringify(header)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
  const b64pay  = btoa(JSON.stringify(payload)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
  const message = `${b64hdr}.${b64pay}`

  // Import PEM private key
  const pem = pemKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )

  const msgBytes = new TextEncoder().encode(message)
  const sigBuf   = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, msgBytes)
  const sig      = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')

  return `${message}.${sig}`
}

// ── Core GA4 runReport helper ─────────────────────────────────
async function runReport(
  propertyId: string,
  token:      string,
  body:       Record<string, unknown>,
  retries = 2
): Promise<any> {
  const url = `${GA_API_BASE}/${propertyId}:runReport`

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.ok) return res.json()

    // 429 = quota exceeded → wait and retry
    if (res.status === 429 && attempt < retries) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000))
      continue
    }

    const errText = await res.text()
    throw new Error(`GA API ${res.status}: ${errText}`)
  }
}

// ── Realtime report helper ────────────────────────────────────
async function runRealtimeReport(
  propertyId: string,
  token:      string,
  body:       Record<string, unknown>
): Promise<any> {
  const url = `${GA_API_BASE}/${propertyId}:runRealtimeReport`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Realtime API ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Parse GA4 row helper ──────────────────────────────────────
function parseRows(
  report: any,
  dimNames: string[],
  metNames: string[]
): Record<string, string | number>[] {
  if (!report?.rows) return []
  return report.rows.map((row: any) => {
    const obj: Record<string, string | number> = {}
    dimNames.forEach((d, i) => { obj[d] = row.dimensionValues?.[i]?.value ?? '' })
    metNames.forEach((m, i) => { obj[m] = parseFloat(row.metricValues?.[i]?.value ?? '0') || 0 })
    return obj
  })
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API — called by the Next.js API routes
// ═══════════════════════════════════════════════════════════════

// ── fetchOverview ─────────────────────────────────────────────
export async function fetchOverview(
  propertyId: string,
  token:      string,
  dateRange:  DateRange
): Promise<TrafficOverview> {
  const dr = { startDate: dateRange.startDate, endDate: dateRange.endDate }

  // Current period + comparison period (same length, prior period)
  const [mainReport, trendReport] = await Promise.all([

    runReport(propertyId, token, {
      dateRanges: [dr],
      metrics: [
        { name: 'sessions' }, { name: 'totalUsers' }, { name: 'newUsers' },
        { name: 'screenPageViews' }, { name: 'bounceRate' },
        { name: 'averageSessionDuration' }, { name: 'screenPageViewsPerSession' },
      ],
    }),

    runReport(propertyId, token, {
      dateRanges: [dr],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' }, { name: 'totalUsers' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),

  ])

  // Main totals
  const totals = mainReport.rows?.[0]
  const get = (i: number) => parseFloat(totals?.metricValues?.[i]?.value ?? '0') || 0

  // Trend
  const trendRows = parseRows(trendReport, ['date'], ['sessions', 'users'])
  const trend: TrendPoint[] = trendRows.map(r => ({
    date:     String(r.date),
    sessions: Number(r.sessions),
    users:    Number(r.users),
    organic:  0, // will be enriched from channel report
  }))

  return {
    sessions:           get(0),
    users:              get(1),
    newUsers:           get(2),
    pageviews:          get(3),
    bounceRate:         parseFloat((get(4) * 100).toFixed(1)),
    avgSessionDuration: get(5),
    pagesPerSession:    parseFloat(get(6).toFixed(2)),
    deltas:             { sessions: 0, users: 0, bounceRate: 0, avgSessionDuration: 0 },
    trend,
  }
}

// ── fetchChannels ─────────────────────────────────────────────
export async function fetchChannels(
  propertyId: string,
  token:      string,
  dateRange:  DateRange
): Promise<ChannelBreakdown[]> {
  const report = await runReport(propertyId, token, {
    dateRanges:  [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions:  [{ name: 'sessionDefaultChannelGroup' }],
    metrics:     [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys:    [{ metric: { metricName: 'sessions' }, desc: true }],
    limit:       10,
  })

  const rows = parseRows(report, ['channel'], ['sessions', 'users'])
  const total = rows.reduce((s, r) => s + Number(r.sessions), 0) || 1

  return rows.map(r => ({
    channel:  String(r.channel),
    sessions: Number(r.sessions),
    users:    Number(r.users),
    pct:      parseFloat(((Number(r.sessions) / total) * 100).toFixed(1)),
  }))
}

// ── fetchTopPages ─────────────────────────────────────────────
export async function fetchTopPages(
  propertyId: string,
  token:      string,
  dateRange:  DateRange,
  limit = 20
): Promise<TopPage[]> {
  const report = await runReport(propertyId, token, {
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [
      { name: 'screenPageViews' }, { name: 'sessions' },
      { name: 'bounceRate' },      { name: 'averageSessionDuration' },
      { name: 'entrances' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  })

  const rows = parseRows(report,
    ['pagePath', 'pageTitle'],
    ['pageviews', 'uniquePageviews', 'bounceRate', 'avgTime', 'entrances']
  )

  return rows.map(r => ({
    pagePath:        String(r.pagePath),
    pageTitle:       String(r.pageTitle),
    pageviews:       Number(r.pageviews),
    uniquePageviews: Number(r.uniquePageviews),
    bounceRate:      parseFloat((Number(r.bounceRate) * 100).toFixed(1)),
    avgTimeOnPage:   Number(r.avgTime),
    entrances:       Number(r.entrances),
    exitRate:        0,
  }))
}

// ── fetchDeviceSplit ──────────────────────────────────────────
export async function fetchDeviceSplit(
  propertyId: string,
  token:      string,
  dateRange:  DateRange
): Promise<DeviceSplit> {
  const report = await runReport(propertyId, token, {
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics:    [{ name: 'sessions' }],
  })

  const rows    = parseRows(report, ['device'], ['sessions'])
  const byDevice: Record<string, number> = {}
  rows.forEach(r => { byDevice[String(r.device).toLowerCase()] = Number(r.sessions) })

  const total = Object.values(byDevice).reduce((a, b) => a + b, 0) || 1

  return {
    desktop: parseFloat(((byDevice['desktop']  || 0) / total * 100).toFixed(1)),
    mobile:  parseFloat(((byDevice['mobile']   || 0) / total * 100).toFixed(1)),
    tablet:  parseFloat(((byDevice['tablet']   || 0) / total * 100).toFixed(1)),
  }
}

// ── fetchGeo ──────────────────────────────────────────────────
export async function fetchGeo(
  propertyId: string,
  token:      string,
  dateRange:  DateRange,
  limit = 10
): Promise<GeoRow[]> {
  const report = await runReport(propertyId, token, {
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'country' }, { name: 'countryId' }],
    metrics:    [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
    limit,
  })

  const rows  = parseRows(report, ['country', 'countryCode'], ['sessions', 'users'])
  const total = rows.reduce((s, r) => s + Number(r.sessions), 0) || 1

  return rows.map(r => ({
    country:     String(r.country),
    countryCode: String(r.countryCode),
    sessions:    Number(r.sessions),
    users:       Number(r.users),
    pct:         parseFloat(((Number(r.sessions) / total) * 100).toFixed(1)),
  }))
}

// ── fetchRealtime ─────────────────────────────────────────────
export async function fetchRealtime(
  propertyId: string,
  token:      string
) {
  const [usersReport, pagesReport, countryReport] = await Promise.all([

    runRealtimeReport(propertyId, token, {
      metrics: [{ name: 'activeUsers' }],
    }),

    runRealtimeReport(propertyId, token, {
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics:    [{ name: 'activeUsers' }],
      orderBys:   [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5,
    }),

    runRealtimeReport(propertyId, token, {
      dimensions: [{ name: 'country' }],
      metrics:    [{ name: 'activeUsers' }],
      orderBys:   [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5,
    }),

  ])

  return {
    activeUsers: parseFloat(usersReport.rows?.[0]?.metricValues?.[0]?.value ?? '0'),
    topPages:    parseRows(pagesReport,  ['pagePath'],  ['activeUsers']).map(r => ({ pagePath: String(r.pagePath), activeUsers: Number(r.activeUsers) })),
    topCountries:parseRows(countryReport,['country'],   ['activeUsers']).map(r => ({ country: String(r.country),  activeUsers: Number(r.activeUsers) })),
  }
}