'use client'

import { useState, useEffect, useCallback } from 'react'
import StatsCard from './StatsCard'
import LineChart from './LineChart'
import DataTable from './DataTable'
import PieChart from './PieChart'
import BarChart from './BarChart'


// Types
type Overview = {
  sessions: number
  users: number
  pageviews: number
  bounceRate: string
  avgSessionDuration: string
}
type TrendData = Array<{ date: string; sessions: number }>
type TableRow = Record<string, string | number>

type AnalyticsData = {
  overview: Overview
  trafficTrend: TrendData
  topPages: TableRow[]
  keywords: TableRow[]
  sources: TableRow[]
  devices: TableRow[]
  countries: TableRow[]
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
      ...style
    }}>
      {children}
    </div>
  )
}

export default function AnalyticsClient({ initialData }: { initialData: AnalyticsData }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [live, setLive] = useState(false)
  const [dateRange, setDateRange] = useState('30days')

  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/google-analytics?date_range=${dateRange}`
      const res = await fetch(url)
      if (res.ok) {
        const newData = await res.json()
        setData(newData)
        setLive(true)
        setTimeout(() => setLive(false), 1000)
      }
    } catch (e) {
      console.error('GA API error:', e)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5 * 60 * 1000) // 5min
    return () => clearInterval(interval)
  }, [refreshData])

  const { overview, trafficTrend, topPages, keywords, sources, devices, countries } = data

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root{--bg:#212121;--sb:#171717;--card:#2f2f2f;--border:#3f3f3f;--border2:#2a2a2a;--t1:#ececec;--t2:#8e8ea0;--t3:#6b6b7b;--acc:#10a37f;--acc-l:#0d2e26;--mono:'DM Mono',monospace} @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(16,163,127,.5)}70%{box-shadow:0 0 0 8px rgba(16,163,127,0)}100%{box-shadow:0 0 0 0 rgba(16,163,127,0)}} .live.pulse{animation:pulse .7s ease}` }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Google Analytics</h2>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>SEO performance metrics • GA4 Property</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{
            background: '#2a2a2a', border: '1px solid var(--border)', borderRadius: 7,
            padding: '6px 12px', color: 'var(--t1)', fontSize: 13, fontFamily: 'var(--sans)'
          }}>
            <option>7days</option>
            <option>30days</option>
            <option>90days</option>
          </select>
          <button onClick={refreshData} disabled={loading} style={{
            padding: '6px 14px', background: loading ? '#2a2a2a' : 'var(--acc-l)',
            border: '1px solid var(--border)', borderRadius: 7, color: 'var(--t1)',
            fontSize: 12, cursor: loading ? 'default' : 'pointer'
          }}>
            {loading ? '⟳' : '↻ Refresh'}
          </button>
          {live && <div className="live pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10a37f' }} />}
        </div>
      </div>

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <StatsCard label="Sessions" value={overview.sessions.toLocaleString()} change="+12.4%" trendIcon="▲" color="#10a37f" />
        <StatsCard label="Users" value={overview.users.toLocaleString()} change="+8.2%" trendIcon="▲" color="#4ade80" />
        <StatsCard label="Pageviews" value={overview.pageviews.toLocaleString()} change="+15.1%" trendIcon="▲" color="#a78bfa" />
        <StatsCard label="Bounce Rate" value={overview.bounceRate} change="-2.1%" trendIcon="▼" color="#f59e0b" />
      </div>

      {/* Main Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Traffic Overview */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Organic Traffic Trend</h3>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>Sessions</div>
          </div>
          <LineChart data={trafficTrend} />
          <div style={{ display: 'flex', gap: 12, marginTop: 16, fontSize: 12 }}>
            <div style={{ color: '#10a37f', fontFamily: 'var(--mono)' }}>● Organic</div>
            <div style={{ color: '#6b6b7b', fontFamily: 'var(--mono)' }}>● All Traffic</div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gap: 12 }}>
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 8 }}>Avg Session</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)' }}>{overview.avgSessionDuration}</div>
          </Card>
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 8 }}>Total Conversions</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)' }}>1,234</div>
          </Card>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Top Pages */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Top Landing Pages</h3>
          </div>
          <DataTable data={topPages.slice(0, 5)} columns={['page', 'pageviews', 'bounceRate', 'duration']} />
        </Card>

        {/* Keywords */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Top Keywords</h3>
          </div>
          <DataTable data={keywords.slice(0, 5)} columns={['keyword', 'clicks', 'ctr', 'position']} />
        </Card>

        {/* Sources */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Traffic Sources</h3>
          </div>
          <PieChart data={sources} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 16 }}>Device Breakdown</h3>
          <BarChart data={devices.map(d => ({ device: d.device as string, sessions: Number(d.sessions) }))} />
        </Card>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 16 }}>Top Countries</h3>
          <DataTable data={countries.slice(0, 6)} columns={['country', 'sessions']} />
        </Card>
      </div>
    </>
  )
}
