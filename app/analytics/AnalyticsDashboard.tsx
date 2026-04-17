'use client'
import Layout from '../../components/Layout'
import { ChannelBreakdown, DATE_RANGES, DateRangeKey, GeoRow, TopPage } from '../../types/analytics'
import { useAnalytics } from '../../hooks/useAnalytics'

function fmtSeconds(s: number) {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return m ? `${m}m ${sec}s` : `${sec}s`
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

const CHANNEL_COLORS: Record<string, string> = {
  'organic search': '#10a37f',
  'direct': '#60a5fa',
  'referral': '#f59e0b',
  'social': '#a78bfa',
  'email': '#fb923c',
  'paid search': '#f87171',
  'display': '#4ade80',
}
function channelColor(name: string) {
  return CHANNEL_COLORS[name.toLowerCase()] || '#6b6b7b'
}
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#262626', border: '1px solid #3a3a3a', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || '#ececec', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 4, fontFamily: 'monospace' }}>{sub}</div>}
    </div>
  )
}

function SectionCard({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #2a2a2a' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ececec', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{icon}</span>{title}
        </span>
        {action}
      </div>
      {children}
    </div>
  )
}

function SkeletonBlock({ h = 20, w = '100%', radius = 6 }: { h?: number; w?: string | number; radius?: number }) {
  return (
    <div style={{ height: h, width: w, background: '#2a2a2a', borderRadius: radius, animation: 'pulse 1.4s ease infinite' }} />
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ background: '#2a1515', border: '1px solid #5a2020', borderRadius: 10, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>⚠</div>
      <p style={{ fontSize: 14, color: '#f87171', marginBottom: 12 }}>{message}</p>
      <button onClick={onRetry} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #5a2020', borderRadius: 7, color: '#f87171', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
        Retry
      </button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#4a4a4a', fontFamily: 'monospace' }}>{message}</p>
    </div>
  )
}

function Sparkline({ points, color = '#10a37f', height = 40 }: {
  points: number[]; color?: string; height?: number
}) {
  if (!points?.length) return null
  const w = 200
  const min = Math.min(...points)
  const max = Math.max(...points) || 1
  const xStep = w / (points.length - 1 || 1)
  const normalize = (v: number) => height - ((v - min) / (max - min || 1)) * height

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * xStep).toFixed(1)} ${normalize(p).toFixed(1)}`).join(' ')
  const area = `${path} L ${((points.length - 1) * xStep).toFixed(1)} ${height} L 0 ${height} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={area} fill={color} opacity="0.15" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function ChannelBar({ channels }: { channels: ChannelBreakdown[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {channels.map(ch => (
        <div key={ch.channel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#d1d1d1', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: channelColor(ch.channel), display: 'inline-block' }} />
              {ch.channel}
            </span>
            <span style={{ fontSize: 12, color: '#8e8ea0', fontFamily: 'monospace' }}>{fmtNum(ch.sessions)} · {ch.pct}%</span>
          </div>
          <div style={{ height: 5, background: '#2a2a2a', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${ch.pct}%`, background: channelColor(ch.channel), borderRadius: 3, transition: 'width .4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PagesTable({ pages }: { pages: TopPage[] }) {
  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '1px solid #3f3f3f' }
  const td: React.CSSProperties = { padding: '9px 12px', borderBottom: '1px solid #2a2a2a', fontSize: 13, color: '#8e8ea0', verticalAlign: 'middle' }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: '35%' }}>Page</th>
            <th style={{ ...th, width: '15%', textAlign: 'right' }}>Pageviews</th>
            <th style={{ ...th, width: '15%', textAlign: 'right' }}>Bounce rate</th>
            <th style={{ ...th, width: '20%', textAlign: 'right' }}>Avg. time</th>
            <th style={{ ...th, width: '15%', textAlign: 'right' }}>Entrances</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p, i) => (
            <tr key={i}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              style={{ transition: 'background .1s' }}>
              <td style={{ ...td, color: '#d1d1d1' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }} title={p.pagePath}>{p.pagePath}</div>
                {p.pageTitle && <div style={{ fontSize: 10, color: '#4a4a4a', fontFamily: 'monospace', marginTop: 2 }}>{p.pageTitle.slice(0, 50)}</div>}
              </td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(p.pageviews)}</td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', color: p.bounceRate > 65 ? '#f87171' : p.bounceRate < 35 ? '#10a37f' : '#8e8ea0' }}>
                {p.bounceRate.toFixed(1)}%
              </td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{fmtSeconds(p.avgTimeOnPage)}</td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(p.entrances)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GeoTable({ rows }: { rows: GeoRow[] }) {
  const max = rows[0]?.sessions || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#6b6b7b', fontFamily: 'monospace', width: 20, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 13, color: '#d1d1d1' }}>{r.country}</span>
              <span style={{ fontSize: 12, color: '#8e8ea0', fontFamily: 'monospace' }}>{fmtNum(r.sessions)} · {r.pct}%</span>
            </div>
            <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${(r.sessions / max) * 100}%`, background: '#378ADD', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const {
    clients, clientsWithGa, selectedClientId, selectedClient,
    dateRangeKey, dateRange,
    isLoading, error, data, realtimeData,
    selectClient, setDateRange, refresh,
  } = useAnalytics()

  const overview = data?.overview
  const channels = data?.channels || []
  const topPages = data?.topPages || []
  const devices = data?.devices
  const geo = data?.geo || []
  const trendVals = (overview?.trend || []).map(t => t.sessions)

  return (
    <Layout title="Analytics">
      <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: '0px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: '#ececec', letterSpacing: '-0.03em', marginBottom: 3 }}>Analytics</h1>
              {data && (
                <div style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>
                  {data.fromCache ? '◷ from cache · ' : '↺ live · '}
                  {new Date(data.fetchedAt).toLocaleTimeString()}
                  <span style={{ marginLeft: 8, color: '#3a3a3a' }}>{data.propertyId}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Realtime pill */}
              {realtimeData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#0d2e26', border: '1px solid rgba(16,163,127,0.3)', borderRadius: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10a37f', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#10a37f', fontFamily: 'monospace' }}>{realtimeData.activeUsers} active now</span>
                </div>
              )}
              {/* Date range */}
              <select value={dateRangeKey} onChange={e => setDateRange(e.target.value as DateRangeKey)}
                style={{ background: '#2f2f2f', border: '1px solid #3a3a3a', borderRadius: 8, padding: '7px 12px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                {DATE_RANGES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              {/* Refresh */}
              <button onClick={refresh} disabled={isLoading}
                style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 8, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isLoading ? '…' : '↺'}
              </button>
            </div>
          </div>

          <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: '14px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Select client
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {clients.length === 0 && (
                <span style={{ fontSize: 13, color: '#4a4a4a', fontStyle: 'italic' }}>Loading clients…</span>
              )}
              {clients.map(c => {
                const hasGa = !!c.ga_property?.is_active
                const isActive = c.id === selectedClientId
                return (
                  <button key={c.id}
                    onClick={() => hasGa && selectClient(c.id)}
                    disabled={!hasGa}
                    style={{
                      padding: '7px 16px',
                      background: isActive ? '#0d2e26' : 'transparent',
                      border: `1px solid ${isActive ? '#10a37f' : hasGa ? '#3a3a3a' : '#2a2a2a'}`,
                      borderRadius: 8,
                      color: isActive ? '#10a37f' : hasGa ? '#d1d1d1' : '#3a3a3a',
                      fontSize: 13,
                      cursor: hasGa ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      fontWeight: isActive ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      transition: 'all .15s',
                    }}>
                    {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10a37f', display: 'inline-block' }} />}
                    {c.name || c.domain}
                    {!hasGa && (
                      <span style={{ fontSize: 9, color: '#3a3a3a', fontFamily: 'monospace', marginLeft: 4 }}>no GA</span>
                    )}
                    {c.ga_property?.last_sync_error && (
                      <span style={{ fontSize: 9, color: '#f87171', fontFamily: 'monospace' }}>⚠</span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedClient?.ga_property && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>
                  {selectedClient.ga_property.property_name || selectedClient.ga_property.property_id}
                </span>
                {selectedClient.ga_property.last_synced_at && (
                  <span style={{ fontSize: 11, color: '#3a3a3a', fontFamily: 'monospace' }}>
                    Last sync: {new Date(selectedClient.ga_property.last_synced_at).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {!selectedClientId && (
            <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#ececec', marginBottom: 8 }}>Select a client to view analytics</p>
              <p style={{ fontSize: 13, color: '#4a4a4a' }}>
                {clientsWithGa.length === 0
                  ? 'No clients have GA4 configured. Add a GA property in Settings.'
                  : `${clientsWithGa.length} client${clientsWithGa.length > 1 ? 's' : ''} have GA4 configured`}
              </p>
            </div>
          )}


          {error && <ErrorState message={error} onRetry={refresh} />}

          {isLoading && !data && selectedClientId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ background: '#262626', border: '1px solid #3a3a3a', borderRadius: 10, padding: '14px 16px' }}><SkeletonBlock h={12} w="60%" /><SkeletonBlock h={28} w="80%" /></div>)}
              </div>
              <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20 }}><SkeletonBlock h={180} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[1, 2].map(i => <div key={i} style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20 }}><SkeletonBlock h={120} /></div>)}
              </div>
            </div>
          )}


          {data && overview && (
            <>
              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 16 }}>
                <KpiCard label="Sessions" value={fmtNum(overview.sessions)} color="#60a5fa" />
                <KpiCard label="Users" value={fmtNum(overview.users)} color="#ececec" />
                <KpiCard label="Pageviews" value={fmtNum(overview.pageviews)} color="#a78bfa" />
                <KpiCard label="Bounce rate" value={`${overview.bounceRate}%`} color={overview.bounceRate > 60 ? '#f87171' : overview.bounceRate < 35 ? '#10a37f' : '#f59e0b'} />
                <KpiCard label="Avg. session" value={fmtSeconds(overview.avgSessionDuration)} color="#10a37f" />
                <KpiCard label="Pages/session" value={overview.pagesPerSession.toFixed(2)} />
              </div>


              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                <SectionCard title={`Sessions trend · ${dateRange.label}`} icon="◈">
                  <Sparkline points={trendVals} color="#378ADD" height={100} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{dateRange.startDate}</span>
                    <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>today</span>
                  </div>
                </SectionCard>
                <SectionCard title="Traffic sources" icon="⊙">
                  {channels.length === 0
                    ? <EmptyState message="No channel data" />
                    : <ChannelBar channels={channels} />}
                </SectionCard>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {devices && (
                  <SectionCard title="Device split" icon="◻">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Desktop', pct: devices.desktop, color: '#60a5fa' },
                        { label: 'Mobile', pct: devices.mobile, color: '#10a37f' },
                        { label: 'Tablet', pct: devices.tablet, color: '#a78bfa' },
                      ].map(d => (
                        <div key={d.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: '#d1d1d1' }}>{d.label}</span>
                            <span style={{ fontSize: 12, color: '#8e8ea0', fontFamily: 'monospace' }}>{d.pct}%</span>
                          </div>
                          <div style={{ height: 6, background: '#2a2a2a', borderRadius: 3 }}>
                            <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {realtimeData && (
                  <SectionCard title="Active users right now" icon="◉"
                    action={<span style={{ fontSize: 12, color: '#10a37f', fontFamily: 'monospace' }}>{realtimeData.activeUsers} online</span>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {realtimeData.topPages.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #2a2a2a' }}>
                          <span style={{ fontSize: 12, color: '#d1d1d1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{p.pagePath}</span>
                          <span style={{ fontSize: 12, color: '#10a37f', fontFamily: 'monospace', flexShrink: 0 }}>{p.activeUsers}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              <SectionCard title="Top pages" icon="◈"
                action={<span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{topPages.length} pages</span>}>
                {topPages.length === 0
                  ? <EmptyState message="No page data for this range" />
                  : <PagesTable pages={topPages.slice(0, 15)} />}
              </SectionCard>

              {/* Geo */}
              {geo.length > 0 && (
                <SectionCard title="Top countries" icon="⊙">
                  <GeoTable rows={geo} />
                </SectionCard>
              )}

              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#3a3a3a', fontFamily: 'monospace' }}>
                Data for property {data.propertyId} · fetched {new Date(data.fetchedAt).toLocaleString()}
                {data.fromCache && ' · from cache'}
              </div>
            </>
          )}

        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(max-width:900px){
          .dash-main{padding-left:24px!important}
        }
      `}</style>
    </Layout>
  )
}