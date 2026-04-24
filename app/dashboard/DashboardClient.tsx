'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    published: { bg: '#0d2e26', color: '#10a37f' },
    approved: { bg: '#1a2e1a', color: '#4ade80' },
    written: { bg: '#1a1a2e', color: '#a78bfa' },
    processing: { bg: '#2a1f0a', color: '#f59e0b' },
    scouted: { bg: '#0f1e2e', color: '#60a5fa' },
    researched: { bg: '#2a1f0a', color: '#f59e0b' },
    used: { bg: '#0d2e26', color: '#10a37f' },
    failed: { bg: '#2a1515', color: '#f87171' },
    active: { bg: '#0d2e26', color: '#10a37f' },
    primary: { bg: '#0d2e26', color: '#10a37f' },
    secondary: { bg: '#2a2a2a', color: '#6b6b7b' },
  }
  const cfg = map[status.toLowerCase()] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
      <span className="inline-flex items-center py-[2px] px-[8px] rounded-[5px] text-[11px] font-medium [font-family:var(--mono)]" style={{ background: cfg.bg, color: cfg.color }}>
      {status}
    </span>
  )
}

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
      <div className={`bg-[var(--card)] border border-[var(--border)] rounded-[12px] p-[16px] md:p-[20px] ${className}`} style={style}>
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

type Stats = {
  totalClients: number; totalArticles: number; totalKeywords: number
  statusCounts: Record<string, number>
  recentArticles: any[]; recentLogs: any[]
}

export default function DashboardClient({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [liveCount, setLiveCount] = useState(0)
  const [pulse, setPulse] = useState(false)

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
    ; (articlesRes.data || []).forEach((a: any) => {
      const s = a.status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    })

    setStats({
      totalClients: clients.count || 0,
      totalArticles: articlesRes.count || 0,
      totalKeywords: keywords.count || 0,
      statusCounts,
      recentArticles: articlesRes.data || [],
      recentLogs: logs.data || [],
    })
    setPulse(true)
    setTimeout(() => setPulse(false), 800)
  }, [sb])

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
  }, [sb, refresh])

  const { totalClients, totalArticles, totalKeywords, statusCounts, recentArticles, recentLogs } = stats

  const KPI = [
    { label: 'Clients', num: totalClients, icon: '◈', bg: '#0d2e26', color: '#10a37f' },
    { label: 'Articles', num: totalArticles, icon: '◇', bg: '#1a1a2e', color: '#a78bfa' },
    { label: 'Keywords', num: totalKeywords, icon: '◆', bg: '#2a1f0a', color: '#f59e0b' },
    { label: 'Published', num: statusCounts.published || 0, icon: '✓', bg: '#0d2e26', color: '#10a37f' },
  ]

  const STATUS_BAR = [
    { label: 'Published', count: statusCounts.published || 0, color: '#10a37f' },
    { label: 'Approved', count: statusCounts.approved || 0, color: '#4ade80' },
    { label: 'Written', count: statusCounts.written || 0, color: '#a78bfa' },
    { label: 'Processing', count: statusCounts.processing || 0, color: '#f59e0b' },
    { label: 'Failed', count: statusCounts.failed || 0, color: '#f87171' },
  ]

  return (
      <>
        {/* Uses flex-wrap so the header naturally stacks on mobile without needing Tailwind breakpoints */}
        <div className="flex flex-wrap items-center justify-between gap-[12px] mb-[20px]">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--t1)] tracking-[-0.02em] mb-[4px]">Dashboard</h2>
            <p className="text-[13px] text-[var(--t2)]">Real-time overview of your content pipeline</p>
          </div>
          <div className="flex items-center gap-[8px] py-[6px] px-[14px] bg-[#0d2e26] border border-[#155e4a] rounded-[8px]">
            <div className={`w-[7px] h-[7px] rounded-full bg-[#10a37f] ${pulse ? 'animate-live-pulse' : ''}`} />
            <span className="text-[12px] text-[#10a37f] [font-family:var(--mono)] font-medium">Live</span>
            {liveCount > 0 && (
                <span className="text-[10px] bg-[#10a37f] text-white rounded-[4px] py-[1px] px-[5px] [font-family:var(--mono)]">
              +{liveCount}
            </span>
            )}
          </div>
        </div>

        {/* NATIVE RESPONSIVE GRID: Bypasses Tailwind classes. Automatically shows 4 columns on desktop and 1-2 on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }} className="mb-[20px]">
          {KPI.map((k, i) => (
              <Card key={k.label} className="animate-kpi-fade" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="flex items-center justify-between mb-[10px]">
                  <span className="text-[11px] text-[var(--t2)] [font-family:var(--mono)] uppercase tracking-[0.06em]">{k.label}</span>
                  <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center text-[13px]" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
                </div>
                <div className="text-[30px] font-semibold text-[var(--t1)] tracking-[-0.04em] leading-none">
                  {k.num.toLocaleString()}
                </div>
              </Card>
          ))}
        </div>

        <Card className="mb-[20px]">
          <div className="flex items-center justify-between mb-[14px]">
            <h3 className="text-[13px] font-semibold text-[var(--t1)]">Article Pipeline Status</h3>
            <span className="text-[11px] text-[var(--t3)] [font-family:var(--mono)]">Updates live</span>
          </div>
          {STATUS_BAR.map(s => {
            const pct = totalArticles > 0 ? Math.round((s.count / totalArticles) * 100) : 0
            return (
                <div key={s.label} className="flex items-center gap-[12px] mb-[10px]">
                  <div className="w-[80px] text-[12px] text-[var(--t2)] shrink-0">{s.label}</div>
                  <div className="flex-1 h-[6px] bg-[#2a2a2a] rounded-[3px] overflow-hidden">
                    <div className="h-full rounded-[3px] transition-[width] duration-500 ease-in-out" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                  <div className="w-[60px] text-right text-[11px] [font-family:var(--mono)] text-[var(--t3)] shrink-0">
                    {s.count} ({pct}%)
                  </div>
                </div>
            )
          })}
        </Card>

        {/* NATIVE RESPONSIVE GRID: Automatically shows 2 columns on desktop and 1 on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }} className="mb-[20px]">
          <Card>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="text-[13px] font-semibold text-[var(--t1)]">Recent Articles</h3>
              <a href="/articles" className="text-[11px] text-[#10a37f] [font-family:var(--mono)] no-underline">View all →</a>
            </div>
            {recentArticles.length === 0 ? (
                <p className="text-[13px] text-[var(--t3)] text-center py-[24px]">No articles yet</p>
            ) : recentArticles.map((a: any) => {
              const clientData = Array.isArray(a.clients) ? a.clients[0] : a.clients
              return (
                  <div key={a.id} className="flex items-center gap-[10px] py-[8px] border-b border-[var(--border2)]">
                    <div className="w-[7px] h-[7px] rounded-full bg-[#10a37f] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[var(--t1)] font-medium truncate">
                        {a.meta_title || a.keyword}
                      </div>
                      <div suppressHydrationWarning className="text-[11px] text-[var(--t3)] [font-family:var(--mono)]">
                        {clientData?.domain || '—'} · {timeAgo(a.updated_at)}
                      </div>
                    </div>
                    <Badge status={a.status} />
                  </div>
              )
            })}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="text-[13px] font-semibold text-[var(--t1)]">Agent Activity</h3>
              <span className="text-[11px] text-[var(--t3)] [font-family:var(--mono)]">Real-time</span>
            </div>
            {recentLogs.length === 0 ? (
                <p className="text-[13px] text-[var(--t3)] text-center py-[24px]">No activity yet</p>
            ) : recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-[10px] py-[7px] border-b border-[var(--border2)]">
                  <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: log.status === 'error' ? '#f87171' : '#10a37f' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[var(--t1)] font-medium">{log.agent_name}</div>
                    <div className="text-[11px] text-[var(--t3)] [font-family:var(--mono)] truncate">{log.action}</div>
                  </div>
                  <span suppressHydrationWarning className="text-[10px] text-[var(--t3)] [font-family:var(--mono)] shrink-0">{timeAgo(log.created_at)}</span>
                </div>
            ))}
          </Card>
        </div>

        <Card>
          <h3 className="text-[13px] font-semibold text-[var(--t1)] mb-[12px]">Quick Actions</h3>
          <div className="flex gap-[8px] flex-wrap">
            {[
              { label: '+ New Client', href: '/onboarding' },
              { label: '◈ Articles', href: '/articles' },
              { label: '◇ Keywords', href: '/keywords' },
              { label: '⚙ Settings', href: '/settings' },
            ].map(a => (
                <a key={a.label} href={a.href} className="py-[9px] px-[16px] rounded-[8px] border border-[var(--border)] bg-[#2a2a2a] text-[var(--t2)] text-[12px] font-medium no-underline transition-all duration-[150ms] hover:text-[var(--t1)]">
                  {a.label}
                </a>
            ))}
          </div>
        </Card>
      </>
  )
}