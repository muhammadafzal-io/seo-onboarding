'use client'
// app/analytics/AnalyticsDashboard.tsx
// Multi-client GA4 dashboard
// ── Client dropdown (fixed top bar) → fetch → render all sections

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnalyticsDashboard, ClientWithGa, DATE_RANGES, DateRangeKey, RealtimeData } from '../../types/analytics'
import Layout from '../../components/Layout'

// ─── Formatters ───────────────────────────────────────────────
const fmtNum = (n: number) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}
const fmtSec = (s: number) => {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  return m ? `${m}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`
}
const fmtPct = (n: number) => `${Number(n || 0).toFixed(1)}%`

const CH_COLORS: Record<string, string> = {
  'organic search': '#10a37f', 'direct': '#60a5fa', 'referral': '#f59e0b',
  'social': '#a78bfa', 'email': '#fb923c', 'paid search': '#f87171',
  'display': '#4ade80', '(other)': '#6b6b7b',
}
const chColor = (n: string) => CH_COLORS[n.toLowerCase()] || '#6b6b7b'

// ─── Small UI pieces ──────────────────────────────────────────
const Card = ({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <div className={`bg-[#242424] border border-[#333] rounded-[12px] p-[18px] ${className}`} style={style}>{children}</div>
)
const CardHead = ({ title, sub }: { title: string; sub?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-[14px] pb-[10px] border-b border-[#2e2e2e]">
      <span className="text-[13px] font-semibold text-[#d4d4d4]">{title}</span>
      {sub && <span className="text-[11px] text-[#5a5a5a] font-mono">{sub}</span>}
    </div>
)
const Skel = ({ h = 14, w = '100%' }: { h?: number; w?: string | number }) => (
    <div className="bg-[#2e2e2e] rounded-[4px] animate-pulse" style={{ height: h, width: w }} />
)
const Bar = ({ pct, color }: { pct: number; color: string }) => (
    <div className="h-[5px] bg-[#2e2e2e] rounded-[3px]">
      <div className="h-full rounded-[3px] transition-[width] duration-400 ease-in-out" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
)

// KPI card
const KPI = ({ label, value, delta, color }: { label: string; value: string; delta?: number; color?: string }) => {
  const up = (delta ?? 0) >= 0
  return (
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-[10px] py-[13px] px-[16px]">
        <div className="text-[10px] text-[#4a4a4a] font-mono uppercase tracking-[0.08em] mb-[7px]">{label}</div>
        <div className="text-[24px] font-semibold tracking-[-0.03em] leading-none" style={{ color: color || '#ececec' }}>{value}</div>
        {delta !== undefined && (
            <div className={`text-[11px] mt-[5px] font-mono ${up ? 'text-[#10a37f]' : 'text-[#f87171]'}`}>
              {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs prev period
            </div>
        )}
      </div>
  )
}

// SVG sparkline — used as chart.js fallback
const Spark = ({ data, color = '#60a5fa', h = 60 }: { data: number[]; color?: string; h?: number }) => {
  if (!data?.length) return <div style={{ height: h }} />
  const w = 600; const min = Math.min(...data); const max = Math.max(...data) || 1
  const xStep = w / (data.length - 1 || 1)
  const y = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 6) - 3
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * xStep).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${((data.length - 1) * xStep).toFixed(1)} ${h} L 0 ${h} Z`
  return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
        <path d={area} fill={color} opacity="0.13" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" />
      </svg>
  )
}

// ─── Chart.js loader + wrappers ───────────────────────────────
function useChartJs() {
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!(window as any).Chart)
  useEffect(() => {
    if ((window as any).Chart) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => setReady(true)
    document.head.appendChild(s)
  }, [])
  return ready
}

function LineChart({ id, labels, series }: {
  id: string
  labels: string[]
  series: { label: string; data: number[]; color: string; dashed?: boolean }[]
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const inst = useRef<any>(null)
  useEffect(() => {
    if (!ref.current || !labels.length) return
    const C = (window as any).Chart; if (!C) return
    if (inst.current) { inst.current.destroy(); inst.current = null }
    inst.current = new C(ref.current, {
      type: 'line',
      data: {
        labels, datasets: series.map(s => ({
          label: s.label, data: s.data,
          borderColor: s.color, backgroundColor: s.color + '15',
          fill: !s.dashed, tension: 0.35, borderWidth: 2,
          borderDash: s.dashed ? [5, 4] : [], pointRadius: 0,
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 }, color: '#555', maxTicksLimit: 8 }, grid: { display: false } },
          y: { ticks: { font: { size: 10 }, color: '#555', callback: (v: number) => fmtNum(v) }, grid: { color: '#2a2a2a' } },
        },
        animation: { duration: 300 },
      },
    })
    return () => { if (inst.current) { inst.current.destroy(); inst.current = null } }
  }, [id, JSON.stringify(labels), JSON.stringify(series)])
  return <div className="relative h-[210px]"><canvas ref={ref} /></div>
}

function DonutChart({ id, data }: { id: string; data: { label: string; value: number; color: string }[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const inst = useRef<any>(null)
  useEffect(() => {
    if (!ref.current || !data.length) return
    const C = (window as any).Chart; if (!C) return
    if (inst.current) { inst.current.destroy(); inst.current = null }
    inst.current = new C(ref.current, {
      type: 'doughnut',
      data: { labels: data.map(d => d.label), datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { display: false } }, animation: { duration: 300 } },
    })
    return () => { if (inst.current) { inst.current.destroy(); inst.current = null } }
  }, [id, JSON.stringify(data)])
  return <div className="relative h-[160px]"><canvas ref={ref} /></div>
}

// ─── Client selector dropdown ─────────────────────────────────
function ClientDropdown({ clients, selectedId, onChange }: {
  clients: ClientWithGa[]
  selectedId: number | null
  onChange: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const cur = clients.find(c => c.id === selectedId)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
      <div ref={box} className="relative w-[260px]">
        {/* Trigger */}
        <button
            onClick={() => setOpen(v => !v)}
            className={`w-full flex items-center justify-between gap-[10px] py-[9px] px-[13px] bg-[#242424] border rounded-[9px] text-[#ececec] text-[14px] cursor-pointer font-inherit transition-colors ${open ? 'border-[#10a37f]' : 'border-[#3a3a3a]'}`}
        >
          <div className="flex items-center gap-[9px] min-w-0">
            {cur ? (
                <>
                  <div className="w-[26px] h-[26px] rounded-[6px] bg-[#0d2e26] border border-[#10a37f44] flex items-center justify-center text-[11px] font-bold text-[#10a37f] shrink-0">
                    {(cur.name || cur.domain)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[13px] font-medium text-[#ececec] overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px]">{cur.name}</div>
                    <div className="text-[10px] text-[#5a5a5a] font-mono mt-[1px]">{cur.domain}</div>
                  </div>
                </>
            ) : <span className="text-[13px] text-[#5a5a5a]">Select a client…</span>}
          </div>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M1.5 3.5L5.5 7.5L9.5 3.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* List */}
        {open && (
            <div className="absolute top-[calc(100%+4px)] left-0 w-full z-[300] bg-[#242424] border border-[#3a3a3a] rounded-[10px] shadow-[0_12px_40px_rgba(0,0,0,0.6)] max-h-[320px] overflow-y-auto">
              {clients.length === 0
                  ? <div className="py-[14px] px-[16px] text-[13px] text-[#5a5a5a]">No clients found</div>
                  : clients.map(c => {
                    const hasGa = !!c.ga_property?.is_active
                    const active = c.id === selectedId
                    return (
                        <div
                            key={c.id}
                            onClick={() => { if (hasGa) { onChange(c.id); setOpen(false) } }}
                            className={`flex items-center gap-[10px] py-[10px] px-[14px] border-b border-[#2e2e2e] transition-colors ${active ? 'bg-[#0d2e26]' : 'bg-transparent'} ${hasGa ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'} ${hasGa && !active ? 'hover:bg-[#2a2a2a]' : ''}`}
                        >
                          <div className={`w-[26px] h-[26px] rounded-[6px] border flex items-center justify-center text-[11px] font-bold shrink-0 ${active ? 'bg-[#0d2e26] border-[#10a37f55] text-[#10a37f]' : 'bg-[#2a2a2a] border-[#444] text-[#777]'}`}>
                            {(c.name || c.domain)[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[13px] ${active ? 'text-[#10a37f] font-semibold' : 'text-[#d4d4d4] font-normal'}`}>{c.name}</div>
                            <div className="text-[10px] text-[#4a4a4a] font-mono">{c.domain}</div>
                          </div>
                          {active && <span className="text-[11px] text-[#10a37f]">✓</span>}
                          {!hasGa && <span className="text-[9px] text-[#555] font-mono bg-[#2e2e2e] py-[1px] px-[5px] rounded-[3px] shrink-0">no GA</span>}
                        </div>
                    )
                  })
              }
            </div>
        )}
      </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AnalyticsDashboardClient() {
  const chartReady = useChartJs()

  const [clients, setClients] = useState<ClientWithGa[]>([])
  const [selId, setSelId] = useState<number | null>(null)
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('28d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dash, setDash] = useState<AnalyticsDashboard | null>(null)
  const [rt, setRt] = useState<RealtimeData | null>(null)
  const [cliLoading, setCliLoading] = useState(true)

  const rtTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load clients list ─────────────────────────────────────
  useEffect(() => {
    setCliLoading(true)
    fetch('/api/analytics/clients')
        .then(r => r.json())
        .then((list: ClientWithGa[]) => {
          setClients(list || [])
          const first = (list || []).find((c: ClientWithGa) => c.ga_property?.is_active)
          if (first) setSelId(first.id)
        })
        .catch(console.error)
        .finally(() => setCliLoading(false))
  }, [])

  // ── Fetch dashboard data ──────────────────────────────────
  const loadDash = useCallback(async (id: number, range: DateRangeKey, bust = false) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analytics/${id}?range=${range}${bust ? '&bust=1' : ''}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setDash(json as AnalyticsDashboard)
    } catch (e: any) { setError(e.message); setDash(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!selId) return
    setDash(null); setRt(null)
    loadDash(selId, rangeKey)
  }, [selId, rangeKey, loadDash])

  // ── Realtime polling ──────────────────────────────────────
  const loadRt = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/analytics/realtime?clientId=${id}`)
      if (!res.ok) return
      const json = await res.json()
      setRt({ activeUsers: json.activeUsers || 0, topPages: json.topPages || [], topCountries: json.topCountries || [] })
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => {
    if (rtTimer.current) clearInterval(rtTimer.current)
    if (!selId) return
    loadRt(selId)
    rtTimer.current = setInterval(() => loadRt(selId), 30_000)
    return () => { if (rtTimer.current) clearInterval(rtTimer.current) }
  }, [selId, loadRt])

  // ── Derived values ────────────────────────────────────────
  const dr = DATE_RANGES.find(d => d.key === rangeKey) || DATE_RANGES[1]
  const selClient = clients.find(c => c.id === selId) || null
  const overview = dash?.overview
  const channels = dash?.channels || []
  const topPages = dash?.topPages || []
  const devices = dash?.devices
  const geo = dash?.geo || []

  // Chart data derivations — only computed when dash is present
  const trendLabels = (overview?.trend || []).map(t => {
    const s = String(t.date)
    if (s.length === 8) return `${s.slice(4, 6)}/${s.slice(6, 8)}`
    return s.slice(5)
  })
  const trendId = `trend-${selId}-${rangeKey}`
  const chanDonut = channels.slice(0, 6).map(c => ({ label: c.channel, value: c.sessions, color: chColor(c.channel) }))
  const devDonut = devices ? [
    { label: `Desktop ${devices.desktop.toFixed(0)}%`, value: devices.desktop, color: '#60a5fa' },
    { label: `Mobile ${devices.mobile.toFixed(0)}%`, value: devices.mobile, color: '#10a37f' },
    { label: `Tablet ${devices.tablet.toFixed(0)}%`, value: devices.tablet, color: '#a78bfa' },
  ] : []

  // ─────────────────────────────────────────────────────────
  return (
      <Layout title="">
        <div className="bg-[#1a1a1a] min-h-screen text-[#ececec] [font-family:'Inter',system-ui,sans-serif]">
          <style>{`
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        `}</style>

          {/* ════ STICKY TOPBAR ════ */}
          <div className="sticky top-0 z-[200] bg-[rgba(20,20,20,0.96)] backdrop-blur-[12px] border-b border-[#2a2a2a] py-[11px] px-[24px]">
            <div className="max-w-[1280px] mx-auto flex items-center gap-[12px] flex-wrap">

              {/* Title */}
              <div className="shrink-0">
                <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#ececec]">Analytics</div>
                {dash && (
                    <div className="text-[10px] text-[#444] font-mono mt-[1px]">
                      {dash.fromCache ? '◷ cached' : '↺ live'} · {new Date(dash.fetchedAt).toLocaleTimeString()}
                      {(dash as any).isMock ? ' · DEMO' : ''}
                    </div>
                )}
              </div>

              <div className="w-[1px] h-[28px] bg-[#2e2e2e] shrink-0" />

              {/* ── CLIENT DROPDOWN ── */}
              {cliLoading
                  ? <div className="w-[260px] h-[42px]"><Skel h={42} /></div>
                  : <ClientDropdown clients={clients} selectedId={selId} onChange={id => setSelId(id)} />
              }

              {/* Date range selector */}
              <select
                  value={rangeKey}
                  onChange={e => setRangeKey(e.target.value as DateRangeKey)}
                  className="py-[9px] px-[12px] bg-[#242424] border border-[#3a3a3a] rounded-[9px] text-[#ececec] text-[13px] outline-none font-inherit cursor-pointer"
              >
                {DATE_RANGES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>

              {/* Refresh */}
              <button
                  disabled={loading || !selId}
                  onClick={() => selId && loadDash(selId, rangeKey, true)}
                  className="flex items-center gap-[6px] py-[9px] px-[14px] bg-transparent border border-[#333] rounded-[9px] text-[#777] text-[13px] font-inherit disabled:cursor-not-allowed cursor-pointer"
              >
                <div className={`w-[11px] h-[11px] rounded-full border-[1.5px] border-transparent ${loading ? 'border-t-[#10a37f] border-x-[#333] border-b-[#333] animate-spin' : 'border-t-[#777]'}`} />
                Refresh
              </button>

              {/* Realtime pill */}
              {rt && selId && (
                  <div className="ml-auto flex items-center gap-[7px] py-[6px] px-[14px] bg-[#0d2e26] border border-[rgba(16,163,127,0.3)] rounded-[20px]">
                    <span className="w-[7px] h-[7px] rounded-full bg-[#10a37f] animate-pulse inline-block" />
                    <span className="text-[14px] font-semibold text-[#10a37f]">{rt.activeUsers}</span>
                    <span className="text-[12px] text-[#10a37f] opacity-70">active now</span>
                  </div>
              )}
            </div>
          </div>

          {/* ════ CONTENT ════ */}
          <div className="max-w-[1280px] mx-auto pt-[22px] px-[24px] pb-[60px]">

            {/* Empty state */}
            {!selId && !cliLoading && (
                <div className="text-center py-[100px]">
                  <div className="text-[44px] text-[#2a2a2a] mb-[16px]">◈</div>
                  <div className="text-[16px] font-medium mb-[8px] text-[#888]">Select a client to load analytics</div>
                  <div className="text-[13px] text-[#444]">
                    {clients.filter(c => c.ga_property?.is_active).length === 0
                        ? 'No GA4 properties configured — go to Analytics → Settings'
                        : `${clients.filter(c => c.ga_property?.is_active).length} clients available in dropdown above`}
                  </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-[#2a1515] border border-[#5a2020] rounded-[10px] py-[14px] px-[18px] mb-[18px] flex items-center justify-between flex-wrap gap-[10px]">
                  <span className="text-[13px] text-[#f87171]">⚠ {error}</span>
                  <button onClick={() => selId && loadDash(selId, rangeKey, true)}
                          className="py-[6px] px-[14px] bg-transparent border border-[#5a2020] rounded-[7px] text-[#f87171] text-[12px] cursor-pointer font-inherit">
                    Retry
                  </button>
                </div>
            )}

            {/* Skeleton */}
            {loading && !dash && selId && (
                <div className="flex flex-col gap-[18px]">
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[12px]">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-[10px] py-[13px] px-[16px]">
                          <Skel h={10} w="55%" /><div className="h-[8px]" /><Skel h={26} w="75%" />
                        </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-[2fr_1fr] gap-[16px]">
                    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-[12px] p-[18px]"><Skel h={210} /></div>
                    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-[12px] p-[18px]"><Skel h={210} /></div>
                  </div>
                </div>
            )}

            {/* ════ DATA ════ */}
            {dash && overview && (
                <div className="flex flex-col gap-[18px]">

                  {/* Property info strip */}
                  <div className="flex items-center gap-[10px] py-[7px] px-[12px] bg-[#1e1e1e] border border-[#2e2e2e] rounded-[8px] flex-wrap">
                <span className="text-[11px] text-[#4a4a4a] font-mono">
                  {selClient?.ga_property?.property_name || dash.propertyId}
                </span>
                    <span className="text-[#2e2e2e]">·</span>
                    <span className="text-[11px] text-[#4a4a4a] font-mono">{dr.label}</span>
                    {dash.fromCache && <><span className="text-[#2e2e2e]">·</span><span className="text-[11px] text-[#4a4a4a] font-mono">cached</span></>}
                    {(dash as any).isMock && (
                        <span className="text-[10px] bg-[#2a1f0a] text-[#f59e0b] border border-[#5a3010] py-[1px] px-[6px] rounded-[4px] font-mono">DEMO DATA</span>
                    )}
                  </div>

                  {/* ── KPI row ── */}
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[12px]">
                    <KPI label="Sessions" value={fmtNum(overview.sessions)} delta={overview.deltas?.sessions} color="#60a5fa" />
                    <KPI label="Users" value={fmtNum(overview.users)} delta={overview.deltas?.users} />
                    <KPI label="New users" value={fmtNum(overview.newUsers)} />
                    <KPI label="Pageviews" value={fmtNum(overview.pageviews)} />
                    <KPI label="Bounce rate" value={fmtPct(overview.bounceRate)} delta={overview.deltas?.bounceRate}
                         color={overview.bounceRate > 60 ? '#f87171' : overview.bounceRate < 35 ? '#10a37f' : '#f59e0b'} />
                    <KPI label="Avg. session" value={fmtSec(overview.avgSessionDuration)} delta={overview.deltas?.avgSessionDuration} color="#10a37f" />
                    <KPI label="Pages/session" value={(overview.pagesPerSession || 0).toFixed(2)} />
                  </div>

                  {/* ── Trend + Channels ── */}
                  <div className="grid grid-cols-[2fr_1fr] gap-[16px]">

                    <Card>
                      <CardHead title={`Sessions trend · ${dr.label}`} sub={`${trendLabels.length} data points`} />
                      <div className="flex gap-[14px] mb-[12px] flex-wrap">
                        {[{ l: 'Sessions', c: '#60a5fa' }, { l: 'Organic', c: '#10a37f' }, { l: 'Users', c: '#a78bfa', d: true }].map(s => (
                            <span key={s.l} className="flex items-center gap-[5px] text-[12px] text-[#777]">
                        <span className="w-[18px] h-[2px] inline-block" style={{ background: s.d ? 'transparent' : s.c, borderTop: s.d ? `2px dashed ${s.c}` : 'none' }} />
                              {s.l}
                      </span>
                        ))}
                      </div>
                      {chartReady && trendLabels.length > 1 ? (
                          <LineChart
                              id={trendId}
                              labels={trendLabels}
                              series={[
                                { label: 'Sessions', data: overview.trend.map(t => t.sessions), color: '#60a5fa' },
                                { label: 'Organic', data: overview.trend.map(t => t.organic), color: '#10a37f' },
                                { label: 'Users', data: overview.trend.map(t => t.users), color: '#a78bfa', dashed: true },
                              ]}
                          />
                      ) : (
                          <div className="h-[210px]">
                            <Spark data={overview.trend.map(t => t.sessions)} color="#60a5fa" h={180} />
                            <div className="text-[11px] text-[#4a4a4a] text-center mt-[4px] font-mono">
                              {!chartReady ? 'Loading chart…' : 'Insufficient data'}
                            </div>
                          </div>
                      )}
                    </Card>

                    <Card>
                      <CardHead title="Traffic channels" />
                      {channels.length === 0
                          ? <div className="py-[32px] text-center text-[13px] text-[#4a4a4a]">No channel data</div>
                          : (
                              <>
                                {chartReady && <DonutChart id={`chan-${selId}`} data={chanDonut} />}
                                <div className={`flex flex-col gap-[9px] ${chartReady ? 'mt-[14px]' : 'mt-0'}`}>
                                  {channels.slice(0, 6).map(c => (
                                      <div key={c.channel}>
                                        <div className="flex justify-between mb-[4px]">
                                <span className="flex items-center gap-[6px] text-[12px] text-[#bbb]">
                                  <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: chColor(c.channel) }} />
                                  {c.channel}
                                </span>
                                          <span className="text-[12px] text-[#5a5a5a] font-mono">
                                  {fmtNum(c.sessions)} · {c.pct}%
                                </span>
                                        </div>
                                        <Bar pct={c.pct} color={chColor(c.channel)} />
                                      </div>
                                  ))}
                                </div>
                              </>
                          )}
                    </Card>
                  </div>

                  {/* ── Devices + Realtime ── */}
                  <div className="grid grid-cols-2 gap-[16px]">

                    <Card>
                      <CardHead title="Device split" />
                      {devDonut.length > 0 ? (
                          <>
                            {chartReady && <DonutChart id={`dev-${selId}`} data={devDonut} />}
                            <div className="flex justify-center gap-[18px] mt-[14px] flex-wrap">
                              {devDonut.map(d => (
                                  <div key={d.label} className="flex items-center gap-[6px] text-[13px]">
                                    <span className="w-[10px] h-[10px] rounded-[2px] inline-block" style={{ background: d.color }} />
                                    <span className="text-[#999]">{d.label}</span>
                                  </div>
                              ))}
                            </div>
                          </>
                      ) : <div className="py-[32px] text-center text-[13px] text-[#4a4a4a]">No device data</div>}
                    </Card>

                    <Card>
                      <CardHead title="Active pages — right now" sub={rt ? `${rt.activeUsers} users` : undefined} />
                      {rt?.topPages?.length ? (
                          <div>
                            {rt.topPages.map((p, i) => (
                                <div key={i} className={`flex items-center gap-[10px] py-[8px] ${i < rt.topPages.length - 1 ? 'border-b border-[#2a2a2a]' : ''}`}>
                                  <span className="text-[10px] text-[#4a4a4a] font-mono w-[18px] text-right shrink-0">#{i + 1}</span>
                                  <span className="text-[13px] text-[#d4d4d4] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{p.pagePath}</span>
                                  <div className="flex items-center gap-[5px] shrink-0">
                                    <span className="w-[6px] h-[6px] rounded-full bg-[#10a37f] animate-pulse inline-block" />
                                    <span className="text-[12px] text-[#10a37f] font-mono font-semibold">{p.activeUsers}</span>
                                  </div>
                                </div>
                            ))}
                            {rt.topCountries?.length > 0 && (
                                <div className="mt-[12px] pt-[12px] border-t border-[#2a2a2a]">
                                  <div className="text-[11px] text-[#4a4a4a] font-mono uppercase tracking-[0.06em] mb-[8px]">Live countries</div>
                                  <div className="flex gap-[8px] flex-wrap">
                                    {rt.topCountries.slice(0, 5).map((c, i) => (
                                        <span key={i} className="text-[11px] text-[#888] font-mono bg-[#2a2a2a] py-[2px] px-[8px] rounded-[5px]">
                                {c.country} · {c.activeUsers}
                              </span>
                                    ))}
                                  </div>
                                </div>
                            )}
                          </div>
                      ) : (
                          <div className="py-[32px] text-center text-[13px] text-[#4a4a4a]">
                            {rt ? 'No active pages' : 'Loading realtime…'}
                          </div>
                      )}
                    </Card>
                  </div>

                  {/* ── Top pages table ── */}
                  <Card>
                    <CardHead title="Top pages" sub={`${topPages.length} pages`} />
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[13px] table-fixed">
                        <thead>
                        <tr>
                          {[
                            { h: 'Page', w: '32%', r: false },
                            { h: 'Pageviews', w: '13%', r: true },
                            { h: 'Unique views', w: '13%', r: true },
                            { h: 'Bounce rate', w: '13%', r: true },
                            { h: 'Avg. time', w: '13%', r: true },
                            { h: 'Entrances', w: '13%', r: true },
                            { h: 'Exit rate', w: '13%', r: true },
                          ].map(col => (
                              <th key={col.h} style={{ width: col.w }} className={`py-[7px] px-[10px] text-[#4a4a4a] text-[11px] font-medium font-mono uppercase tracking-[0.05em] border-b border-[#2e2e2e] whitespace-nowrap ${col.r ? 'text-right' : 'text-left'}`}>
                                {col.h}
                              </th>
                          ))}
                        </tr>
                        </thead>
                        <tbody>
                        {topPages.slice(0, 15).map((p, i) => (
                            <tr key={i} className="transition-colors duration-100 hover:bg-[#222]">
                              <td className="py-[9px] px-[10px] border-b border-[#242424] align-middle">
                                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[#d4d4d4]" title={p.pagePath}>{p.pagePath}</div>
                                {p.pageTitle && <div className="text-[10px] text-[#4a4a4a] font-mono mt-[2px] overflow-hidden text-ellipsis whitespace-nowrap">{p.pageTitle.slice(0, 50)}</div>}
                              </td>
                              <td className="py-[9px] px-[10px] text-right border-b border-[#242424] font-mono text-[#888]">{fmtNum(p.pageviews)}</td>
                              <td className="py-[9px] px-[10px] text-right border-b border-[#242424] font-mono text-[#888]">{fmtNum(p.uniquePageviews)}</td>
                              <td className="py-[9px] px-[10px] text-right border-b border-[#242424] font-mono" style={{ color: p.bounceRate > 65 ? '#f87171' : p.bounceRate < 35 ? '#10a37f' : '#888' }}>
                                {fmtPct(p.bounceRate)}
                              </td>
                              <td className="py-[9px] px-[10px] text-right border-b border-[#242424] font-mono text-[#888]">{fmtSec(p.avgTimeOnPage)}</td>
                              <td className="py-[9px] px-[10px] text-right border-b border-[#242424] font-mono text-[#888]">{fmtNum(p.entrances)}</td>
                              <td className="py-[9px] px-[10px] text-right border-b border-[#242424] font-mono text-[#888]">{fmtPct(p.exitRate)}</td>
                            </tr>
                        ))}
                        {topPages.length === 0 && (
                            <tr><td colSpan={7} className="py-[40px] px-[10px] text-center text-[#4a4a4a] text-[13px]">No page data for this period</td></tr>
                        )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* ── Geo ── */}
                  {geo.length > 0 && (
                      <Card>
                        <CardHead title="Top countries" sub={`${geo.length} countries`} />
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[12px]">
                          {geo.map((g, i) => (
                              <div key={g.country} className="flex items-center gap-[10px]">
                                <span className="text-[10px] text-[#4a4a4a] font-mono w-[20px] text-right shrink-0">#{i + 1}</span>
                                <div className="flex-1">
                                  <div className="flex justify-between mb-[4px]">
                                    <span className="text-[13px] text-[#d4d4d4]">{g.country}</span>
                                    <span className="text-[12px] text-[#5a5a5a] font-mono">{fmtNum(g.sessions)} · {g.pct}%</span>
                                  </div>
                                  <Bar pct={(g.sessions / (geo[0]?.sessions || 1)) * 100} color="#378ADD" />
                                </div>
                              </div>
                          ))}
                        </div>
                      </Card>
                  )}

                  {/* Footer */}
                  <div className="text-center text-[11px] text-[#2e2e2e] font-mono pt-[4px]">
                    {dash.propertyId} · refreshed {new Date(dash.fetchedAt).toLocaleString()}
                  </div>

                </div>
            )}
          </div>
        </div>

      </Layout>
  )
}