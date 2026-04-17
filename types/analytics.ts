// types/analytics.ts

// ─────────────────────────────────────────
// Date Range
// ─────────────────────────────────────────

export type DateRangeKey =
  | '7d'
  | '14d'
  | '28d'
  | '90d'
  | '12m'

export interface DateRange {
  key: DateRangeKey
  label?: string

  startDate: string
  endDate: string

  days?: number
}

// ─────────────────────────────────────────
// Date ranges
// ─────────────────────────────────────────

export const DATE_RANGES: DateRange[] = [
  {
    key: '7d',
    label: 'Last 7 days',
    days: 7,
    startDate: '7daysAgo',
    endDate: 'today',
  },
  {
    key: '14d',
    label: 'Last 14 days',
    days: 14,
    startDate: '14daysAgo',
    endDate: 'today',
  },
  {
    key: '28d',
    label: 'Last 28 days',
    days: 28,
    startDate: '28daysAgo',
    endDate: 'today',
  },
  {
    key: '90d',
    label: 'Last 90 days',
    days: 90,
    startDate: '90daysAgo',
    endDate: 'today',
  },
  {
    key: '12m',
    label: 'Last 12 months',
    days: 365,
    startDate: '365daysAgo',
    endDate: 'today',
  },
]



// ─────────────────────────────────────────
// Trend
// ─────────────────────────────────────────

export interface TrendPoint {
  date: string

  sessions: number
  users: number

  organic: number
}



// ─────────────────────────────────────────
// Traffic Overview
// ─────────────────────────────────────────

export interface TrafficOverview {
  sessions: number
  users: number
  newUsers: number

  pageviews: number

  bounceRate: number
  avgSessionDuration: number

  pagesPerSession: number

  deltas: {
    sessions: number
    users: number
    bounceRate: number
    avgSessionDuration: number
  }

  trend: TrendPoint[]
}



// ─────────────────────────────────────────
// Channels
// ─────────────────────────────────────────

export interface ChannelBreakdown {
  channel: string

  sessions: number
  users: number

  pct: number
}



// ─────────────────────────────────────────
// Top Pages
// ─────────────────────────────────────────

export interface TopPage {
  pagePath: string
  pageTitle: string

  pageviews: number
  uniquePageviews: number

  bounceRate: number

  avgTimeOnPage: number

  entrances: number

  exitRate: number
}



// ─────────────────────────────────────────
// Devices
// ─────────────────────────────────────────

export interface DeviceSplit {
  desktop: number
  mobile: number
  tablet: number
}



// ─────────────────────────────────────────
// Geography
// ─────────────────────────────────────────

export interface GeoRow {
  country: string

  countryCode: string

  sessions: number
  users: number

  pct: number
}



// ─────────────────────────────────────────
// Realtime
// ─────────────────────────────────────────

export interface RealtimeTopPage {
  pagePath: string
  activeUsers: number
}

export interface RealtimeCountry {
  country: string
  activeUsers: number
}

export interface RealtimeData {
  activeUsers: number

  topPages: RealtimeTopPage[]

  topCountries: RealtimeCountry[]
}



// ─────────────────────────────────────────
// Dashboard payload
// ─────────────────────────────────────────

export interface AnalyticsDashboard {
  propertyId: string

  fetchedAt: string

  fromCache: boolean

  overview: TrafficOverview

  channels: ChannelBreakdown[]

  topPages: TopPage[]

  devices: DeviceSplit

  geo: GeoRow[]
}



// ─────────────────────────────────────────
// Client + GA Property
// ─────────────────────────────────────────

export interface GaProperty {
  currency: string
  service_account_email: string
  timezone: string
  id: number

  property_id: string
  property_name?: string

  is_active: boolean

  last_synced_at?: string | null
  last_sync_error?: string | null
}

export interface ClientWithGa {
  id: number

  name?: string
  domain?: string

  ga_property?: GaProperty | null
}



// ─────────────────────────────────────────
// Hook state
// ─────────────────────────────────────────

export interface DashboardState {
  selectedClientId: number | null

  dateRangeKey: DateRangeKey

  isLoading: boolean

  error: string | null

  data: AnalyticsDashboard | null

  realtimeData: RealtimeData | null

  clients: ClientWithGa[]
}