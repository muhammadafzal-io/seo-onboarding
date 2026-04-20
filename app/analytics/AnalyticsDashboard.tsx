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
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#242424', border: '1px solid #333', borderRadius: 12, padding: 18, ...style }}>{children}</div>
)
const CardHead = ({ title, sub }: { title: string; sub?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #2e2e2e' }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d4' }}>{title}</span>
    {sub && <span style={{ fontSize: 11, color: '#5a5a5a', fontFamily: 'monospace' }}>{sub}</span>}
  </div>
)
const Skel = ({ h = 14, w = '100%' }: { h?: number; w?: string | number }) => (
  <div style={{ height: h, width: w, background: '#2e2e2e', borderRadius: 4, animation: 'pulse 1.4s ease infinite' }} />
)
const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div style={{ height: 5, background: '#2e2e2e', borderRadius: 3 }}>
    <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
  </div>
)

// KPI card
const KPI = ({ label, value, delta, color }: { label: string; value: string; delta?: number; color?: string }) => {
  const up = (delta ?? 0) >= 0
  return (
    <div style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 10, padding: '13px 16px' }}>
      <div style={{ fontSize: 10, color: '#4a4a4a', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || '#ececec', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {delta !== undefined && (
        <div style={{ fontSize: 11, color: up ? '#10a37f' : '#f87171', marginTop: 5, fontFamily: 'monospace' }}>
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
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
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
  return <div style={{ position: 'relative', height: 210 }}><canvas ref={ref} /></div>
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
  return <div style={{ position: 'relative', height: 160 }}><canvas ref={ref} /></div>
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

    <div ref={box} style={{ position: 'relative', width: 260 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '9px 13px', background: '#242424', border: `1px solid ${open ? '#10a37f' : '#3a3a3a'}`,
          borderRadius: 9, color: '#ececec', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {cur ? (
            <>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0d2e26', border: '1px solid #10a37f44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#10a37f', flexShrink: 0 }}>
                {(cur.name || cur.domain)[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#ececec', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{cur.name}</div>
                <div style={{ fontSize: 10, color: '#5a5a5a', fontFamily: 'monospace', marginTop: 1 }}>{cur.domain}</div>
              </div>
            </>
          ) : <span style={{ fontSize: 13, color: '#5a5a5a' }}>Select a client…</span>}
        </div>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }}>
          <path d="M1.5 3.5L5.5 7.5L9.5 3.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* List */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', zIndex: 300,
          background: '#242424', border: '1px solid #3a3a3a', borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,.6)', maxHeight: 320, overflowY: 'auto',
        }}>
          {clients.length === 0
            ? <div style={{ padding: '14px 16px', fontSize: 13, color: '#5a5a5a' }}>No clients found</div>
            : clients.map(c => {
              const hasGa = !!c.ga_property?.is_active
              const active = c.id === selectedId
              return (
                <div
                  key={c.id}
                  onClick={() => { if (hasGa) { onChange(c.id); setOpen(false) } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: active ? '#0d2e26' : 'transparent',
                    cursor: hasGa ? 'pointer' : 'not-allowed', opacity: hasGa ? 1 : 0.38,
                    borderBottom: '1px solid #2e2e2e', transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (hasGa && !active) e.currentTarget.style.background = '#2a2a2a' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: active ? '#0d2e26' : '#2a2a2a', border: `1px solid ${active ? '#10a37f55' : '#444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: active ? '#10a37f' : '#777', flexShrink: 0 }}>
                    {(c.name || c.domain)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: active ? '#10a37f' : '#d4d4d4', fontWeight: active ? 600 : 400 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: '#4a4a4a', fontFamily: 'monospace' }}>{c.domain}</div>
                  </div>
                  {active && <span style={{ fontSize: 11, color: '#10a37f' }}>✓</span>}
                  {!hasGa && <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace', background: '#2e2e2e', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>no GA</span>}
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
    <Layout title={''}>
      <div style={{ background: '#1a1a1a', minHeight: '100vh', color: '#ececec', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin   { to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

        {/* ════ STICKY TOPBAR ════ */}
        <div style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(20,20,20,.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2a2a', padding: '11px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

            {/* Title */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: '#ececec' }}>Analytics</div>
              {dash && (
                <div style={{ fontSize: 10, color: '#444', fontFamily: 'monospace', marginTop: 1 }}>
                  {dash.fromCache ? '◷ cached' : '↺ live'} · {new Date(dash.fetchedAt).toLocaleTimeString()}
                  {(dash as any).isMock ? ' · DEMO' : ''}
                </div>
              )}
            </div>

            <div style={{ width: 1, height: 28, background: '#2e2e2e', flexShrink: 0 }} />

            {/* ── CLIENT DROPDOWN ── */}
            {cliLoading
              ? <div style={{ width: 260, height: 42 }}><Skel h={42} /></div>
              : <ClientDropdown clients={clients} selectedId={selId} onChange={id => setSelId(id)} />
            }

            {/* Date range selector */}
            <select
              value={rangeKey}
              onChange={e => setRangeKey(e.target.value as DateRangeKey)}
              style={{ padding: '9px 12px', background: '#242424', border: '1px solid #3a3a3a', borderRadius: 9, color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {DATE_RANGES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>

            {/* Refresh */}
            <button
              disabled={loading || !selId}
              onClick={() => selId && loadDash(selId, rangeKey, true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'transparent', border: '1px solid #333', borderRadius: 9, color: '#777', fontSize: 13, cursor: (loading || !selId) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              <div style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid', borderColor: loading ? '#333' : 'transparent', borderTopColor: loading ? '#10a37f' : '#777', animation: loading ? 'spin .7s linear infinite' : 'none' }} />
              Refresh
            </button>

            {/* Realtime pill */}
            {rt && selId && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: '#0d2e26', border: '1px solid rgba(16,163,127,.3)', borderRadius: 20 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10a37f', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#10a37f' }}>{rt.activeUsers}</span>
                <span style={{ fontSize: 12, color: '#10a37f', opacity: 0.7 }}>active now</span>
              </div>
            )}
          </div>
        </div>

        {/* ════ CONTENT ════ */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '22px 24px 60px' }}>

          {/* Empty state */}
          {!selId && !cliLoading && (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ fontSize: 44, color: '#2a2a2a', marginBottom: 16 }}>◈</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#888' }}>Select a client to load analytics</div>
              <div style={{ fontSize: 13, color: '#444' }}>
                {clients.filter(c => c.ga_property?.is_active).length === 0
                  ? 'No GA4 properties configured — go to Analytics → Settings'
                  : `${clients.filter(c => c.ga_property?.is_active).length} clients available in dropdown above`}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#2a1515', border: '1px solid #5a2020', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#f87171' }}>⚠ {error}</span>
              <button onClick={() => selId && loadDash(selId, rangeKey, true)}
                style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #5a2020', borderRadius: 7, color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Retry
              </button>
            </div>
          )}

          {/* Skeleton */}
          {loading && !dash && selId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 10, padding: '13px 16px' }}>
                    <Skel h={10} w="55%" /><div style={{ height: 8 }} /><Skel h={26} w="75%" />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 12, padding: 18 }}><Skel h={210} /></div>
                <div style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 12, padding: 18 }}><Skel h={210} /></div>
              </div>
            </div>
          )}

          {/* ════ DATA ════ */}
          {dash && overview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Property info strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>
                  {selClient?.ga_property?.property_name || dash.propertyId}
                </span>
                <span style={{ color: '#2e2e2e' }}>·</span>
                <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{dr.label}</span>
                {dash.fromCache && <><span style={{ color: '#2e2e2e' }}>·</span><span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>cached</span></>}
                {(dash as any).isMock && (
                  <span style={{ fontSize: 10, background: '#2a1f0a', color: '#f59e0b', border: '1px solid #5a3010', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>DEMO DATA</span>
                )}
              </div>

              {/* ── KPI row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

                <Card>
                  <CardHead title={`Sessions trend · ${dr.label}`} sub={`${trendLabels.length} data points`} />
                  <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                    {[{ l: 'Sessions', c: '#60a5fa' }, { l: 'Organic', c: '#10a37f' }, { l: 'Users', c: '#a78bfa', d: true }].map(s => (
                      <span key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#777' }}>
                        <span style={{ width: 18, height: 2, background: s.d ? 'transparent' : s.c, borderTop: s.d ? `2px dashed ${s.c}` : 'none', display: 'inline-block' }} />
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
                    <div style={{ height: 210 }}>
                      <Spark data={overview.trend.map(t => t.sessions)} color="#60a5fa" h={180} />
                      <div style={{ fontSize: 11, color: '#4a4a4a', textAlign: 'center', marginTop: 4, fontFamily: 'monospace' }}>
                        {!chartReady ? 'Loading chart…' : 'Insufficient data'}
                      </div>
                    </div>
                  )}
                </Card>

                <Card>
                  <CardHead title="Traffic channels" />
                  {channels.length === 0
                    ? <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: '#4a4a4a' }}>No channel data</div>
                    : (
                      <>
                        {chartReady && <DonutChart id={`chan-${selId}`} data={chanDonut} />}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: chartReady ? 14 : 0 }}>
                          {channels.slice(0, 6).map(c => (
                            <div key={c.channel}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#bbb' }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: chColor(c.channel), flexShrink: 0 }} />
                                  {c.channel}
                                </span>
                                <span style={{ fontSize: 12, color: '#5a5a5a', fontFamily: 'monospace' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                <Card>
                  <CardHead title="Device split" />
                  {devDonut.length > 0 ? (
                    <>
                      {chartReady && <DonutChart id={`dev-${selId}`} data={devDonut} />}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
                        {devDonut.map(d => (
                          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                            <span style={{ color: '#999' }}>{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: '#4a4a4a' }}>No device data</div>}
                </Card>

                <Card>
                  <CardHead title="Active pages — right now" sub={rt ? `${rt.activeUsers} users` : undefined} />
                  {rt?.topPages?.length ? (
                    <div>
                      {rt.topPages.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < rt.topPages.length - 1 ? '1px solid #2a2a2a' : 'none' }}>
                          <span style={{ fontSize: 10, color: '#4a4a4a', fontFamily: 'monospace', width: 18, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                          <span style={{ fontSize: 13, color: '#d4d4d4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.pagePath}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10a37f', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                            <span style={{ fontSize: 12, color: '#10a37f', fontFamily: 'monospace', fontWeight: 600 }}>{p.activeUsers}</span>
                          </div>
                        </div>
                      ))}
                      {rt.topCountries?.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #2a2a2a' }}>
                          <div style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Live countries</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {rt.topCountries.slice(0, 5).map((c, i) => (
                              <span key={i} style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', background: '#2a2a2a', padding: '2px 8px', borderRadius: 5 }}>
                                {c.country} · {c.activeUsers}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: '#4a4a4a' }}>
                      {rt ? 'No active pages' : 'Loading realtime…'}
                    </div>
                )}
                </Card>
              </div>

              {/* ── Top pages table ── */}
              <Card>
                <CardHead title="Top pages" sub={`${topPages.length} pages`} />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
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
                          <th key={col.h} style={{ width: col.w, padding: '7px 10px', textAlign: col.r ? 'right' : 'left', color: '#4a4a4a', fontSize: 11, fontWeight: 500, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2e2e2e', whiteSpace: 'nowrap' }}>
                            {col.h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.slice(0, 15).map((p, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = '#222'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ transition: 'background .1s' }}>
                          <td style={{ padding: '9px 10px', borderBottom: '1px solid #242424', verticalAlign: 'middle' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#d4d4d4' }} title={p.pagePath}>{p.pagePath}</div>
                            {p.pageTitle && <div style={{ fontSize: 10, color: '#4a4a4a', fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.pageTitle.slice(0, 50)}</div>}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '1px solid #242424', fontFamily: 'monospace', color: '#888' }}>{fmtNum(p.pageviews)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '1px solid #242424', fontFamily: 'monospace', color: '#888' }}>{fmtNum(p.uniquePageviews)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '1px solid #242424', fontFamily: 'monospace', color: p.bounceRate > 65 ? '#f87171' : p.bounceRate < 35 ? '#10a37f' : '#888' }}>
                            {fmtPct(p.bounceRate)}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '1px solid #242424', fontFamily: 'monospace', color: '#888' }}>{fmtSec(p.avgTimeOnPage)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '1px solid #242424', fontFamily: 'monospace', color: '#888' }}>{fmtNum(p.entrances)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '1px solid #242424', fontFamily: 'monospace', color: '#888' }}>{fmtPct(p.exitRate)}</td>
                        </tr>
                      ))}
                      {topPages.length === 0 && (
                        <tr><td colSpan={7} style={{ padding: '40px 10px', textAlign: 'center', color: '#4a4a4a', fontSize: 13 }}>No page data for this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* ── Geo ── */}
              {geo.length > 0 && (
                <Card>
                  <CardHead title="Top countries" sub={`${geo.length} countries`} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                    {geo.map((g, i) => (
                      <div key={g.country} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, color: '#4a4a4a', fontFamily: 'monospace', width: 20, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: '#d4d4d4' }}>{g.country}</span>
                            <span style={{ fontSize: 12, color: '#5a5a5a', fontFamily: 'monospace' }}>{fmtNum(g.sessions)} · {g.pct}%</span>
                          </div>
                          <Bar pct={(g.sessions / (geo[0]?.sessions || 1)) * 100} color="#378ADD" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: 11, color: '#2e2e2e', fontFamily: 'monospace', paddingTop: 4 }}>
                {dash.propertyId} · refreshed {new Date(dash.fetchedAt).toLocaleString()}
              </div>

            </div>
          )}
        </div>
      </div>

    </Layout>
  )
}