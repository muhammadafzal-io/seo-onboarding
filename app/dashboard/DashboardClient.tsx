'use client'
// app/dashboard/DashboardClient.tsx
// PLACE THIS FILE AT: seo-onboarding/app/dashboard/DashboardClient.tsx  (NEW FILE)
//
// This is a CLIENT component ('use client' at top).
// It uses the PUBLIC anon key (safe for browser) to subscribe to Realtime.
// It receives initialStats from the server component (page.tsx) as props.

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// ── Inline components (no external imports needed) ─────────────

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    published:  { bg: '#0d2e26', color: '#10a37f' },
    approved:   { bg: '#1a2e1a', color: '#4ade80' },
    written:    { bg: '#1a1a2e', color: '#a78bfa' },
    processing: { bg: '#2a1f0a', color: '#f59e0b' },
    scouted:    { bg: '#0f1e2e', color: '#60a5fa' },
    researched: { bg: '#2a1f0a', color: '#f59e0b' },
    used:       { bg: '#0d2e26', color: '#10a37f' },
    failed:     { bg: '#2a1515', color: '#f87171' },
    active:     { bg: '#0d2e26', color: '#10a37f' },
    primary:    { bg: '#0d2e26', color: '#10a37f' },
    secondary:  { bg: '#2a2a2a', color: '#6b6b7b' },
  }
  const cfg = map[status.toLowerCase()] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, fontFamily: 'var(--mono)', background: cfg.bg, color: cfg.color }}>
      {status}
    </span>
  )
}

function Card({ children, style , className}: { children: React.ReactNode; style?: React.CSSProperties; className?: any }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  )
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Realtime dashboard ────────────────────────────────────────

type Stats = {
  totalClients: number; totalArticles: number; totalKeywords: number
  statusCounts: Record<string, number>
  recentArticles: any[]; recentLogs: any[]
}

export default function DashboardClient({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats]         = useState<Stats>(initialStats)
  const [liveCount, setLiveCount] = useState(0)
  const [pulse, setPulse]         = useState(false)

  // Use PUBLIC anon key — safe for browser
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const refresh = useCallback(async () => {
    const [clients, articlesRes, keywords, logs] = await Promise.all([
      sb.from('clients').select('id', { count: 'exact', head: true }),
      sb.from('articles')
        .select('id, status, keyword, meta_title, updated_at, clients(name, domain)', { count: 'exact' })
        .order('updated_at', { ascending: false }).limit(8),
      sb.from('keywords').select('id', { count: 'exact', head: true }),
      sb.from('agent_logs')
        .select('id, agent_name, action, status, created_at')
        .order('created_at', { ascending: false }).limit(10),
    ])

    const statusCounts = { published: 0, approved: 0, written: 0, processing: 0, scouted: 0, failed: 0 }
    ;(articlesRes.data || []).forEach((a: any) => {
      const s = a.status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    })

    setStats({
      totalClients:   clients.count      || 0,
      totalArticles:  articlesRes.count  || 0,
      totalKeywords:  keywords.count     || 0,
      statusCounts,
      recentArticles: articlesRes.data   || [],
      recentLogs:     logs.data          || [],
    })
    setPulse(true)
    setTimeout(() => setPulse(false), 800)
  }, [])

  useEffect(() => {
    const channel = sb
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
        setLiveCount(c => c + 1); refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'keywords' }, () => refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, () => {
        setLiveCount(c => c + 1); refresh()
      })
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [refresh])

  const { totalClients, totalArticles, totalKeywords, statusCounts, recentArticles, recentLogs } = stats

  const KPI = [
    { label: 'Clients',   num: totalClients,         icon: '◈', bg: '#0d2e26', color: '#10a37f' },
    { label: 'Articles',  num: totalArticles,         icon: '◇', bg: '#1a1a2e', color: '#a78bfa' },
    { label: 'Keywords',  num: totalKeywords,         icon: '◆', bg: '#2a1f0a', color: '#f59e0b' },
    { label: 'Published', num: statusCounts.published || 0, icon: '✓', bg: '#0d2e26', color: '#10a37f' },
  ]

  const STATUS_BAR = [
    { label: 'Published',  count: statusCounts.published  || 0, color: '#10a37f' },
    { label: 'Approved',   count: statusCounts.approved   || 0, color: '#4ade80' },
    { label: 'Written',    count: statusCounts.written    || 0, color: '#a78bfa' },
    { label: 'Processing', count: statusCounts.processing || 0, color: '#f59e0b' },
    { label: 'Failed',     count: statusCounts.failed     || 0, color: '#f87171' },
  ]

  return (
    <>
      <style>{`
        :root{--bg:#212121;--sb:#171717;--card:#2f2f2f;--border:#3f3f3f;--border2:#2a2a2a;--t1:#ececec;--t2:#8e8ea0;--t3:#6b6b7b;--acc:#10a37f;--acc-l:#0d2e26;--mono:'DM Mono',monospace}
        @keyframes kpiFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(16,163,127,.5)}70%{box-shadow:0 0 0 8px rgba(16,163,127,0)}100%{box-shadow:0 0 0 0 rgba(16,163,127,0)}}
        .kpi{animation:kpiFade .4s ease both}
        .live.pulse{animation:livePulse .7s ease}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Dashboard</h2>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>Real-time overview of your content pipeline</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#0d2e26', border: '1px solid #155e4a', borderRadius: 8 }}>
          <div className={`live${pulse ? ' pulse' : ''}`} style={{ width: 7, height: 7, borderRadius: '50%', background: '#10a37f' }} />
          <span style={{ fontSize: 12, color: '#10a37f', fontFamily: 'var(--mono)', fontWeight: 500 }}>Live</span>
          {liveCount > 0 && (
            <span style={{ fontSize: 10, background: '#10a37f', color: '#fff', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--mono)' }}>
              +{liveCount}
            </span>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {KPI.map((k, i) => (
          <Card key={k.label} style={{ animationDelay: `${i * 0.07}s` } as any} className="kpi">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {k.num.toLocaleString()}
            </div>
          </Card>
        ))}
      </div>

      {/* Status bar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Article Pipeline Status</h3>
          <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>Updates live</span>
        </div>
        {STATUS_BAR.map(s => {
          const pct = totalArticles > 0 ? Math.round((s.count / totalArticles) * 100) : 0
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 80, fontSize: 12, color: 'var(--t2)', flexShrink: 0 }}>{s.label}</div>
              <div style={{ flex: 1, height: 6, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3, transition: 'width .5s ease' }} />
              </div>
              <div style={{ width: 60, textAlign: 'right', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--t3)', flexShrink: 0 }}>
                {s.count} ({pct}%)
              </div>
            </div>
          )
        })}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Recent articles */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Recent Articles</h3>
            <a href="/articles" style={{ fontSize: 11, color: '#10a37f', fontFamily: 'var(--mono)', textDecoration: 'none' }}>View all →</a>
          </div>
          {recentArticles.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '24px 0' }}>No articles yet — submit a client to start</p>
          ) : recentArticles.map((a: any) => {
            const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10a37f', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.meta_title || a.keyword}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                    {client?.domain || '—'} · {timeAgo(a.updated_at)}
                  </div>
                </div>
                <Badge status={a.status} />
              </div>
            )
          })}
        </Card>

        {/* Agent logs */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Agent Activity</h3>
            <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>Real-time</span>
          </div>
          {recentLogs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '24px 0' }}>No activity yet</p>
          ) : recentLogs.map((log: any) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: log.status === 'error' ? '#f87171' : '#10a37f', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 500 }}>{log.agent_name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.action}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{timeAgo(log.created_at)}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '+ New Client',    href: '/'         },
            { label: '◈ Articles',      href: '/articles' },
            { label: '◇ Keywords',      href: '/keywords' },
            { label: '⚙ Settings',      href: '/settings' },
          ].map(a => (
            <a key={a.label} href={a.href} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#2a2a2a', color: 'var(--t2)', fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'all .15s' }}>
              {a.label}
            </a>
          ))}
        </div>
      </Card>
    </>
  )
}