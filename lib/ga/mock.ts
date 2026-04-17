// lib/ga/mock.ts
// Drop-in dummy data generator.
// Swap this for lib/ga/client.ts imports in the API route to run without GA credentials.
// Every function signature matches the real client.ts exactly.

import { ChannelBreakdown, DateRange, DeviceSplit, GeoRow, TopPage, TrafficOverview } from "../../types/analytics";

// Deterministic seeded random — same client always gets same base numbers
function seeded(n: number) {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

function r(base: number, variance: number, seed: number) {
  return Math.round(base * (1 - variance + seeded(seed) * variance * 2))
}

// ── Per-client base config ────────────────────────────────────
const CLIENT_CONFIG: Record<number, { sessionBase: number; bounceBase: number; durBase: number }> = {
  1: { sessionBase: 12000, bounceBase: 42, durBase: 204 }, // Acme Corp
  2: { sessionBase: 8000,  bounceBase: 38, durBase: 178 }, // TechStart
  3: { sessionBase: 22000, bounceBase: 55, durBase: 312 }, // HealthPlus
  4: { sessionBase: 6000,  bounceBase: 31, durBase: 156 }, // FinanceHub
}

function getConfig(clientId: number) {
  return CLIENT_CONFIG[clientId] || { sessionBase: 10000, bounceBase: 45, durBase: 200 }
}

// ── Overview ──────────────────────────────────────────────────
export function mockOverview(clientId: number, dateRange: DateRange): TrafficOverview {
  const cfg      = getConfig(clientId)
  const days     = parseDays(dateRange.startDate)
  const sessions = r(cfg.sessionBase, 0.15, clientId * 7)
  const users    = Math.round(sessions * 0.62)
  const newUsers = Math.round(users * 0.48)
  const pageviews= Math.round(sessions * 2.4)
  const bounceRate = parseFloat((cfg.bounceBase + (seeded(clientId * 3) - 0.5) * 4).toFixed(1))
  const avgDur   = r(cfg.durBase, 0.1, clientId * 11)
  const pps      = parseFloat((1.8 + seeded(clientId * 13) * 1.2).toFixed(2))

  // Daily trend
  const trend = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - days + i + 1)
    const base = Math.round(sessions / days)
    const s    = r(base, 0.4, clientId * 100 + i)
    return {
      date:     d.toISOString().slice(0, 10).replace(/-/g, ''),
      sessions: s,
      users:    Math.round(s * 0.62),
      organic:  Math.round(s * 0.55),
    }
  })

  const prevSessions = Math.round(sessions * 0.88)

  return {
    sessions, users, newUsers, pageviews,
    bounceRate, avgSessionDuration: avgDur, pagesPerSession: pps,
    deltas: {
      sessions:           parseFloat(((sessions / prevSessions - 1) * 100).toFixed(1)),
      users:              parseFloat(((users / Math.round(prevSessions * 0.62) - 1) * 100).toFixed(1)),
      bounceRate:         parseFloat((-2.1 + seeded(clientId) * 2).toFixed(1)),
      avgSessionDuration: parseFloat((3.4 + seeded(clientId * 2) * 2).toFixed(1)),
    },
    trend,
  }
}

// ── Channels ──────────────────────────────────────────────────
export function mockChannels(clientId: number, overview: TrafficOverview): ChannelBreakdown[] {
  const total = overview.sessions
  const organic   = Math.round(total * 0.55)
  const direct    = Math.round(total * 0.20)
  const referral  = Math.round(total * 0.13)
  const social    = Math.round(total * 0.08)
  const email     = Math.round(total * 0.04)

  return [
    { channel: 'Organic Search', sessions: organic,  users: Math.round(organic*0.6),  pct: parseFloat((organic/total*100).toFixed(1)) },
    { channel: 'Direct',         sessions: direct,   users: Math.round(direct*0.7),   pct: parseFloat((direct/total*100).toFixed(1)) },
    { channel: 'Referral',       sessions: referral, users: Math.round(referral*0.55),pct: parseFloat((referral/total*100).toFixed(1)) },
    { channel: 'Social',         sessions: social,   users: Math.round(social*0.5),   pct: parseFloat((social/total*100).toFixed(1)) },
    { channel: 'Email',          sessions: email,    users: Math.round(email*0.6),    pct: parseFloat((email/total*100).toFixed(1)) },
  ]
}

// ── Top pages ─────────────────────────────────────────────────
export function mockTopPages(clientId: number, overview: TrafficOverview): TopPage[] {
  const base = overview.sessions
  const cfg  = getConfig(clientId)

  const PAGES = [
    { path: '/blog/seo-guide',          share: 0.18 },
    { path: '/pricing',                 share: 0.12 },
    { path: '/features',                share: 0.10 },
    { path: '/blog/keyword-research',   share: 0.09 },
    { path: '/about',                   share: 0.07 },
    { path: '/contact',                 share: 0.05 },
    { path: '/blog/link-building',      share: 0.08 },
    { path: '/case-studies',            share: 0.06 },
    { path: '/blog/technical-seo',      share: 0.07 },
    { path: '/integrations',            share: 0.04 },
  ]

  return PAGES.map((p, i) => {
    const pv      = Math.round(base * p.share * (0.9 + seeded(clientId * 50 + i) * 0.2))
    const bounce  = parseFloat((cfg.bounceBase - 10 + seeded(clientId * 30 + i) * 20).toFixed(1))
    const avgTime = Math.round(60 + seeded(clientId * 40 + i) * 280)
    return {
      pagePath:        p.path,
      pageTitle:       p.path.replace(/\//g,'').replace(/-/g,' '),
      pageviews:       pv,
      uniquePageviews: Math.round(pv * 0.78),
      bounceRate:      Math.min(80, Math.max(15, bounce)),
      avgTimeOnPage:   avgTime,
      entrances:       Math.round(pv * 0.4),
      exitRate:        parseFloat((bounce * 0.7).toFixed(1)),
    }
  }).sort((a, b) => b.pageviews - a.pageviews)
}

// ── Device split ──────────────────────────────────────────────
export function mockDeviceSplit(clientId: number): DeviceSplit {
  const mobileBase = [50, 54, 57, 44][clientId - 1] || 52
  const desktopBase = Math.round(100 - mobileBase - 8)
  return { desktop: desktopBase, mobile: mobileBase, tablet: 8 }
}

// ── Geo ───────────────────────────────────────────────────────
export function mockGeo(clientId: number): GeoRow[] {
  const GEO_BASE = [
    { country: 'United States', countryCode: 'US', pct: 38 },
    { country: 'United Kingdom',countryCode: 'GB', pct: 14 },
    { country: 'Canada',        countryCode: 'CA', pct: 11 },
    { country: 'Germany',       countryCode: 'DE', pct: 8  },
    { country: 'Australia',     countryCode: 'AU', pct: 7  },
    { country: 'India',         countryCode: 'IN', pct: 6  },
    { country: 'France',        countryCode: 'FR', pct: 5  },
    { country: 'Netherlands',   countryCode: 'NL', pct: 4  },
    { country: 'Singapore',     countryCode: 'SG', pct: 3  },
    { country: 'Brazil',        countryCode: 'BR', pct: 4  },
  ]
  const total = 10000
  return GEO_BASE.map(g => ({
    ...g,
    pct:      g.pct + Math.round((seeded(clientId * 20 + g.pct) - 0.5) * 2),
    sessions: Math.round(total * g.pct / 100),
    users:    Math.round(total * g.pct / 100 * 0.8),
  }))
}

// ── Realtime ──────────────────────────────────────────────────
export function mockRealtime(clientId: number) {
  const active = Math.floor(8 + seeded(clientId * Date.now() / 1e9) * 55)
  return {
    activeUsers: active,
    topPages: [
      { pagePath: '/blog/seo-guide',       activeUsers: Math.floor(active * 0.28) },
      { pagePath: '/pricing',              activeUsers: Math.floor(active * 0.18) },
      { pagePath: '/features',             activeUsers: Math.floor(active * 0.12) },
      { pagePath: '/blog/keyword-research',activeUsers: Math.floor(active * 0.09) },
    ],
    topCountries: [
      { country: 'United States', activeUsers: Math.floor(active * 0.40) },
      { country: 'United Kingdom',activeUsers: Math.floor(active * 0.15) },
      { country: 'Canada',        activeUsers: Math.floor(active * 0.10) },
    ],
  }
}

// ── Helper ────────────────────────────────────────────────────
function parseDays(startDate: string): number {
  if (startDate.includes('daysAgo')) return parseInt(startDate)
  const diff = Date.now() - new Date(startDate).getTime()
  return Math.max(1, Math.ceil(diff / 86400000))
}