'use client'
// app/client/[id]/ClientProfileClient.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation' // Added for refreshing data
import Card from '../../../components/Card'
import Layout from '../../../components/Layout'
import KeywordPublishModal from '../../../components/KeywordPublishModal'
import RegenerateButton from '../../../components/RegenerateButton' // 1. IMPORT BUTTON

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  published:     { bg: '#0d2e26', color: '#10a37f' },
  approved:      { bg: '#1a2e1a', color: '#4ade80' },
  written:       { bg: '#1a1a2e', color: '#a78bfa' },
  processing:    { bg: '#2a1f0a', color: '#f59e0b' },
  scouted:       { bg: '#0f1e2e', color: '#60a5fa' },
  researched:    { bg: '#2a1a10', color: '#fb923c' },
  failed:        { bg: '#2a1515', color: '#f87171' },
  need_revision: { bg: '#2a1a2e', color: '#d946ef' },
  new:           { bg: '#0f1e2e', color: '#60a5fa' },
  queued:        { bg: '#1a2a1a', color: '#4ade80' },
}

function Badge({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status?.toLowerCase()] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: '#262626', border: '1px solid #3f3f3f', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: color || '#ececec', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  )
}

function StatusBar({ statCounts, total }: { statCounts: Record<string, number>; total: number }) {
  const entries = [
    { key: 'published',  color: '#10a37f' },
    { key: 'approved',   color: '#4ade80' },
    { key: 'written',    color: '#a78bfa' },
    { key: 'processing', color: '#f59e0b' },
    { key: 'scouted',    color: '#60a5fa' },
    { key: 'failed',     color: '#f87171' },
  ].filter(e => (statCounts[e.key] || 0) > 0)

  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
        {entries.map(e => {
          const pct = total > 0 ? (statCounts[e.key] / total) * 100 : 0
          return <div key={e.key} style={{ width: `${pct}%`, background: e.color }} title={`${e.key}: ${statCounts[e.key]}`} />
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {entries.map(e => (
          <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#8e8ea0' }}>{e.key}: {statCounts[e.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type ProfileData = {
  client:         any
  stats:          any
  statCounts:     Record<string, number>
  recentArticles: any[]
  recentKeywords: any[]
}

export default function ClientProfileClient({ data }: { data: ProfileData }) {
  const { client, stats, statCounts, recentArticles, recentKeywords } = data
  const router = useRouter()

  const [publishingKw, setPublishingKw] = useState<any | null>(null)
  const [queuedIds,    setQueuedIds]    = useState<Set<number>>(new Set())

  // Refresh page data to show new generations or status changes
  const handleRefresh = () => {
    router.refresh()
  }

  const handlePublishSuccess = (kwId: number) => {
    setQueuedIds(prev => new Set([...prev, kwId]))
    setPublishingKw(null)
    handleRefresh()
  } 

  const s = {
    section:      { background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20, marginBottom: 16 } as React.CSSProperties,
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#ececec', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
    field:        { fontSize: 13, color: '#ececec', fontWeight: 500 } as React.CSSProperties,
    fieldLabel:   { fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3, display: 'block' },
    th:           { padding: '8px 12px', textAlign: 'left' as const, color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const, fontWeight: 500 },
    td:           { padding: '10px 12px', borderBottom: '1px solid #2a2a2a', fontSize: 13, color: '#8e8ea0', verticalAlign: 'middle' as const },
  }

  const initials = (client.name || client.domain || 'C').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const niche    = client.niche || 'General'

  return (
    <Layout title="Client Profile">
      <Card>
        {publishingKw && (
          <KeywordPublishModal
            keyword={publishingKw}
            onClose={() => setPublishingKw(null)}
            onSuccess={handlePublishSuccess}
          />
        )}

        <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: 24 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 12, color: '#6b6b7b' }}>
              <a href="/dashboard" style={{ color: '#6b6b7b', textDecoration: 'none' }}>Dashboard</a>
              <span>›</span>
              <a href="/clients" style={{ color: '#6b6b7b', textDecoration: 'none' }}>Clients</a>
              <span>›</span>
              <span style={{ color: '#ececec' }}>{client.name || client.domain}</span>
            </div>

            {/* Profile header */}
            <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 14, padding: 24, marginBottom: 16, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg, #10a37f, #0d6e5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 600, color: '#ececec', letterSpacing: '-0.02em', margin: 0 }}>{client.name || client.domain}</h1>
                  <span style={{ fontSize: 11, color: '#10a37f', background: '#0d2e26', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>{niche}</span>
                </div>
                {client.domain && (
                  <a href={`https://${client.domain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#10a37f', textDecoration: 'none', fontFamily: 'monospace' }}>
                    ↗ {client.domain}
                  </a>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                  {client.email           && <span style={{ fontSize: 12, color: '#8e8ea0' }}>✉ {client.email}</span>}
                  {client.schedule        && <span style={{ fontSize: 12, color: '#8e8ea0' }}>◷ {client.schedule}</span>}
                  {client.publish_platform && <span style={{ fontSize: 12, color: '#8e8ea0' }}>◈ {client.publish_platform}</span>}
                  <span style={{ fontSize: 12, color: '#6b6b7b', fontFamily: 'monospace' }}>
                    Client since {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a href={`/articles?clientId=${client.id}`}      style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Articles</a>
                <a href={`/keywords?clientId=${client.id}`}      style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Keywords</a>
                <a href={`/create-article?clientId=${client.id}`} style={{ padding: '7px 14px', background: '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>+ Article</a>
              </div>
            </div>

            {/* KPI stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              <StatCard label="Total Articles"   value={stats.totalArticles} />
              <StatCard label="Published"        value={stats.published}     color="#10a37f" />
              <StatCard label="In Pipeline"      value={stats.totalArticles - stats.published - stats.failed} color="#f59e0b" />
              <StatCard label="Total Keywords" value={stats.totalKeywords} />
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Left Column */}
              <div>
                <div style={s.section}>
                  <div style={s.sectionTitle}><span>◈</span> Article Status</div>
                  {stats.totalArticles > 0
                    ? <StatusBar statCounts={statCounts} total={stats.totalArticles} />
                    : <p style={{ fontSize: 13, color: '#4a4a4a', textAlign: 'center', padding: '16px 0' }}>No articles yet</p>
                  }
                </div>

                <div style={s.section}>
                  <div style={s.sectionTitle}><span>◇</span> Client Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: 'Name',     val: client.name },
                      { label: 'Email',    val: client.email },
                      { label: 'Domain',   val: client.domain },
                      { label: 'Niche',    val: client.niche },
                      { label: 'Platform', val: client.publish_platform },
                      { label: 'Schedule', val: client.schedule },
                      { label: 'Tone',     val: client.tone },
                      { label: 'Language', val: 'en' },
                    ].filter(f => f.val).map(f => (
                      <div key={f.label}>
                        <span style={s.fieldLabel}>{f.label}</span>
                        <div style={s.field}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* ── Recent Articles List ── */}
                <div style={s.section}>
                  <div style={{ ...s.sectionTitle, justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>◈</span> Recent Articles</span>
                    <a href={`/articles?clientId=${client.id}`} style={{ fontSize: 11, color: '#10a37f', textDecoration: 'none', fontFamily: 'monospace', fontWeight: 400 }}>.</a>
                  </div>
                  {recentArticles.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#4a4a4a', textAlign: 'center', padding: '16px 0' }}>No articles yet</p>
                  ) : recentArticles.map((a: any) => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #2a2a2a' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_STYLE[a.status]?.color || '#6b6b7b', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#d1d1d1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.meta_title || a.keyword}
                        </div>
                        <div style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{timeAgo(a.updated_at)}</div>
                      </div>

                      {/* 2. ADD REGENERATE BUTTON TO RECENT LIST */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RegenerateButton
                          articleId={a.id}
                          keyword={a.keyword}
                          status={a.status}
                          generation={a.generation || 1}
                          onSuccess={handleRefresh}
                        />
                        <Badge status={a.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Keywords table ── */}
                <div style={s.section}>
                  <div style={{ ...s.sectionTitle, justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>◇</span> Keywords</span>
                    <a href={`/keywords?clientId=${client.id}`} style={{ fontSize: 11, color: '#10a37f', textDecoration: 'none', fontFamily: 'monospace', fontWeight: 400 }}>View all →</a>
                  </div>

                  {recentKeywords.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#4a4a4a', textAlign: 'center', padding: '16px 0' }}>No keywords yet</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #3f3f3f' }}>
                          <th style={{ ...s.th, paddingLeft: 0 }}>Keyword</th>
                            <th style={{ ...s.th, textAlign: 'right' }}>Vol</th>
                          <th style={{ ...s.th, textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentKeywords.map((kw: any) => {
                          const isQueued = queuedIds.has(kw.id)
                          const articleStatus = kw.article_status ?? null
                          const canPublish    = articleStatus === 'new' && !isQueued

                          return (
                            <tr key={kw.id} style={{ transition: 'background .1s' }} onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ ...s.td, paddingLeft: 0, color: kw.is_primary ? '#10a37f' : '#d1d1d1', fontWeight: kw.is_primary ? 600 : 400, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {kw.keyword}
                              </td>
                              <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                                {kw.search_volumes > 0 ? kw.search_volumes.toLocaleString() : '—'}
                              </td>
                              <td style={{ ...s.td, textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                                  {isQueued ? (
                                    <span style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace', background: '#0d2e26', padding: '3px 8px', borderRadius: 5 }}>✓ Queued</span>
                                  ) : canPublish ? (
                                    <button
                                        onClick={() => setPublishingKw({ ...kw, client_id: client.id })}
                                        style={{ padding: '4px 12px', background: '#10a37f', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                                      >
                                        Publish Article
                                      </button>
                                    ) : (
                                        <>
                                          {/* 3. ADD REGENERATE BUTTON TO KEYWORDS TABLE (if article exists) */}
                                          {kw.article_id && (
                                            <RegenerateButton
                                              articleId={kw.article_id}
                                              keyword={kw.keyword}
                                              status={articleStatus}
                                              onSuccess={handleRefresh}
                                            />
                                          )}
                                      <Badge status={articleStatus || kw.status} />
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Layout>
  )
}