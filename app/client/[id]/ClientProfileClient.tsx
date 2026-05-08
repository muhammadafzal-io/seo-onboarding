'use client'
// app/client/[id]/ClientProfileClient.tsx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../../../components/Card'
import Layout from '../../../components/Layout'
import KeywordPublishModal from '../../../components/KeywordPublishModal'
import RegenerateButton from '../../../components/RegenerateButton'

const REVIEWABLE_STATUSES = ['written', 'human_review', 'need_revision']

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
  published: { bg: '#0d2e26', color: '#10a37f' },
  approved: { bg: '#1a2e1a', color: '#4ade80' },
  written: { bg: '#1a1a2e', color: '#a78bfa' },
  processing: { bg: '#2a1f0a', color: '#f59e0b' },
  scouted: { bg: '#0f1e2e', color: '#60a5fa' },
  researched: { bg: '#2a1a10', color: '#fb923c' },
  failed: { bg: '#2a1515', color: '#f87171' },
  need_revision: { bg: '#2a1a2e', color: '#d946ef' },
  new: { bg: '#0f1e2e', color: '#60a5fa' },
  queued: { bg: '#1a2a1a', color: '#4ade80' },
}

function Badge({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status?.toLowerCase()] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  )
}

function parseKeywordList(raw: any): string[] {
  try {
    if (!raw) return []
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item: any) => {
        if (typeof item === 'string') return item
        if (item && typeof item.keyword === 'string') return item.keyword
        return ''
      })
      .filter(Boolean)
  } catch {
    return []
  }
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
    { key: 'published', color: '#10a37f' },
    { key: 'approved', color: '#4ade80' },
    { key: 'written', color: '#a78bfa' },
    { key: 'processing', color: '#f59e0b' },
    { key: 'scouted', color: '#60a5fa' },
    { key: 'failed', color: '#f87171' },
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
  client: any
  stats: any
  statCounts: Record<string, number>
  recentArticles: any[]
  recentKeywords: any[]
}

export default function ClientProfileClient({ data }: { data: ProfileData }) {
  // Inside ClientProfileClient function

  const { client, stats, statCounts, recentArticles, recentKeywords } = data
  const router = useRouter()

  const [publishingKw, setPublishingKw] = useState<any | null>(null)
  const [queuedIds, setQueuedIds] = useState<Set<number>>(new Set())

  const handleRefresh = () => {
    router.refresh()
  }
  useEffect(() => {
    // 1. Check if any article or keyword is currently "in progress"
    const isInProgress = recentArticles.some(a => a.status === 'scouted' || a.status === 'researched') ||
      recentKeywords.some(k => k.article_status === 'scouted');

    if (isInProgress) {
      // 2. Set up a poll to check every 5 seconds
      const pollInterval = setInterval(() => {
        console.log("Refreshing data to check for 'new' status...");
        router.refresh(); // This re-runs the Server Side data fetching
      }, 5000);

      // 3. Clean up the interval if the user leaves the page or status changes
      return () => clearInterval(pollInterval);
    }
  }, [recentArticles, recentKeywords, router]);

  const handlePublishSuccess = (kwId: number) => {
    setQueuedIds(prev => new Set([...prev, kwId]))
    setPublishingKw(null)
    handleRefresh()
  }

  const s = {
    section: { background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#ececec', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 8 },
    field: { fontSize: 13, color: '#ececec', fontWeight: 500 },
    fieldLabel: { fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, display: 'block' },
    th: { padding: '8px 12px', textAlign: 'left', color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', fontWeight: 500 },
    td: { padding: '10px 12px', borderBottom: '1px solid #2a2a2a', fontSize: 13, color: '#8e8ea0', verticalAlign: 'middle' },
  } as const

  const initials = (client.name || client.domain || 'C').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const niche = client.niche || 'General'

  const reviewableCount = recentArticles.filter((a: any) => REVIEWABLE_STATUSES.includes(a.status)).length

  const [keywordsOpen, setKeywordsOpen] = useState(false)
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [keywordsError, setKeywordsError] = useState<string | null>(null)
  const [clientKeywords, setClientKeywords] = useState<any[] | null>(null)
  const [expandedKeywordRows, setExpandedKeywordRows] = useState<Set<number>>(new Set())
  const [newArticleOpen, setNewArticleOpen] = useState(false)
  const [newArticleSubmitting, setNewArticleSubmitting] = useState(false)
  const [newArticleLoadingDefaults, setNewArticleLoadingDefaults] = useState(false)
  const [newArticleError, setNewArticleError] = useState<string | null>(null)
  const [newArticleSuccess, setNewArticleSuccess] = useState<string | null>(null)
  const [newArticleForm, setNewArticleForm] = useState({
    websiteUrls: [] as string[],
    keywords: [] as string[],
    contextRaw: '',
  })

  const openKeywords = async () => {
    setKeywordsOpen(true)
    if (clientKeywords !== null || keywordsLoading) return

    try {
      setKeywordsLoading(true)
      setKeywordsError(null)
      const res = await fetch(`/api/clients/${client.id}/keywords`)
      if (!res.ok) {
        throw new Error('Failed to load client keywords')
      }
      const body = await res.json()
      setClientKeywords(body.keywords || [])
    } catch (e: any) {
      setKeywordsError(e.message || 'Failed to load client keywords')
    } finally {
      setKeywordsLoading(false)
    }
  }

  const toggleKeywordRowExpansion = (keywordId: number) => {
    setExpandedKeywordRows(prev => {
      const next = new Set(prev)
      if (next.has(keywordId)) {
        next.delete(keywordId)
      } else {
        next.add(keywordId)
      }
      return next
    })
  }

  const openGenerateArticleModal = async () => {
    setNewArticleOpen(true)
    setNewArticleError(null)
    setNewArticleSuccess(null)
    setNewArticleLoadingDefaults(true)

    try {
      const res = await fetch(`/api/clients/${client.id}/generate-article`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to fetch onboarding data')

      setNewArticleForm({
        websiteUrls: body.website_urls || [],
        keywords: body.keywords || [],
        contextRaw: JSON.stringify(body.client_context || {}, null, 2),
      })
    } catch (e: any) {
      setNewArticleError(e.message || 'Failed to fetch onboarding data')
    } finally {
      setNewArticleLoadingDefaults(false)
    }
  }

  const submitGeneratedArticle = async () => {
    setNewArticleSubmitting(true)
    setNewArticleError(null)
    setNewArticleSuccess(null)

    try {
      let parsedContext: any = null
      try {
        parsedContext = newArticleForm.contextRaw.trim() ? JSON.parse(newArticleForm.contextRaw) : null
      } catch {
        throw new Error('Client context must be valid JSON')
      }

      const res = await fetch(`/api/clients/${client.id}/generate-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_urls: newArticleForm.websiteUrls,
          keywords: newArticleForm.keywords,
          client_context: parsedContext,
        }),
      })

      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to trigger article generation')

      setNewArticleSuccess('Article generator webhook triggered successfully.')
      handleRefresh()
      setNewArticleOpen(false)
    } catch (e: any) {
      setNewArticleError(e.message || 'Failed to trigger article generation')
    } finally {
      setNewArticleSubmitting(false)
    }
  }

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
                  {client.email && <span style={{ fontSize: 12, color: '#8e8ea0' }}>✉ {client.email}</span>}
                  {client.schedule && <span style={{ fontSize: 12, color: '#8e8ea0' }}>◷ {client.schedule}</span>}
                  {client.publish_platform && <span style={{ fontSize: 12, color: '#8e8ea0' }}>◈ {client.publish_platform}</span>}
                  <span style={{ fontSize: 12, color: '#6b6b7b', fontFamily: 'monospace' }}>
                    Client since {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a href={`/articles?clientId=${client.id}`} style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Articles</a>
                <a href={`/keywords?clientId=${client.id}`} style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Keywords</a>
                <button
                  onClick={openGenerateArticleModal}
                  disabled={newArticleSubmitting}
                  style={{ padding: '7px 14px', background: '#0f1e2e', border: '1px solid #1f3a58', borderRadius: 7, color: '#60a5fa', fontSize: 12, fontWeight: 600, cursor: newArticleSubmitting ? 'wait' : 'pointer', opacity: newArticleSubmitting ? 0.8 : 1 }}
                >
                  {newArticleSubmitting ? 'Generating...' : 'Generate New Article'}
                </button>
                <button
                  onClick={openKeywords}
                  style={{ padding: '7px 14px', background: '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Client Keywords
                </button>
                <a href={`/create-article?clientId=${client.id}`} style={{ padding: '7px 14px', background: '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>+ Article</a>
              </div>
            </div>
            {newArticleError && (
              <div style={{ marginTop: -6, marginBottom: 12, padding: '9px 12px', background: '#2a1515', border: '1px solid #5a2020', borderRadius: 8, color: '#f87171', fontSize: 12, fontFamily: 'monospace' }}>
                ⚠ {newArticleError}
              </div>
            )}
            {newArticleSuccess && (
              <div style={{ marginTop: -6, marginBottom: 12, padding: '9px 12px', background: '#0d2e26', border: '1px solid #1d5b4c', borderRadius: 8, color: '#10a37f', fontSize: 12, fontFamily: 'monospace' }}>
                ✓ {newArticleSuccess}
              </div>
            )}

            {/* KPI stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              <StatCard label="Total Articles" value={stats.totalArticles} />
              <StatCard label="Published" value={stats.published} color="#10a37f" />
              <StatCard label="In Pipeline" value={stats.totalArticles - stats.published - stats.failed} color="#f59e0b" />
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
                      { label: 'Name', val: client.name },
                      { label: 'Email', val: client.email },
                      { label: 'Domain', val: client.domain },
                      { label: 'Niche', val: client.niche },
                      { label: 'Platform', val: client.publish_platform },
                      { label: 'Schedule', val: client.schedule },
                      { label: 'Tone', val: client.tone },
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>◈</span>
                      Recent Articles
                      {reviewableCount > 0 && (
                        <span style={{ fontSize: 9, color: '#fb923c', background: '#2a1a10', padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace', border: '1px solid #5a3010' }}>
                          {reviewableCount} need review
                        </span>
                      )}
                    </span>
                    <a href={`/articles?clientId=${client.id}`} style={{ fontSize: 11, color: '#10a37f', textDecoration: 'none', fontFamily: 'monospace', fontWeight: 400 }}>View all →</a>
                  </div>

                  {recentArticles.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#4a4a4a', textAlign: 'center', padding: '16px 0', margin: 0 }}>No articles yet</p>
                  ) : recentArticles.map((a: any) => {
                    const canReview = REVIEWABLE_STATUSES.includes(a.status)
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #2a2a2a' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_STYLE[a.status]?.color || '#6b6b7b', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: '#d1d1d1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.meta_title || a.keyword}
                          </div>
                          <div style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{timeAgo(a.updated_at)}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {canReview ? (
                            <a
                              href={`/articles/${a.id}/review`}
                              style={{
                                padding: '3px 10px',
                                background: a.status === 'need_revision' ? '#2a1515' : '#2a1a10',
                                border: `1px solid ${a.status === 'need_revision' ? '#5a2020' : '#5a3010'}`,
                                borderRadius: 6,
                                color: a.status === 'need_revision' ? '#f87171' : '#fb923c',
                                fontSize: 11,
                                fontWeight: 600,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                fontFamily: 'inherit',
                              }}
                            >
                              {a.status === 'need_revision' ? '↩ Revision' : '◻ Review'}
                            </a>
                          ) : a.status === 'approved' ? (
                            <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace', background: '#1a2e1a', padding: '3px 8px', borderRadius: 5 }}>✓ Approved</span>
                          ) : a.status === 'published' && a.wp_url ? (
                            <a
                              href={a.wp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace', textDecoration: 'none' }}
                            >
                              ↗ Live
                            </a>
                          ) : (
                            <>
                                    <RegenerateButton
                                      articleId={a.id}
                                      keyword={a.keyword}
                                      status={a.status}
                                      generation={a.generation || 1}
                                      onSuccess={handleRefresh}
                                    />
                                    <Badge status={a.status} />
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
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
                          const canPublish = articleStatus === 'new' && !isQueued

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

        {keywordsOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={e => { if (e.target === e.currentTarget) setKeywordsOpen(false) }}
          >
            <div
              style={{
                background: '#2f2f2f',
                border: '1px solid #3f3f3f',
                borderRadius: 14,
                width: '100%',
                maxWidth: 900,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #3f3f3f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Client Keywords
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#ececec' }}>
                    {client.name || client.domain}
                  </div>
                </div>
                <button
                  onClick={() => setKeywordsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3f3f3f',
                    borderRadius: 7,
                    color: '#8e8ea0',
                    fontSize: 13,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {keywordsLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>
                    Loading keywords...
                  </div>
                ) : keywordsError ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#f87171', fontSize: 13 }}>
                    {keywordsError}
                  </div>
                ) : !clientKeywords || clientKeywords.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>
                    No keywords found for this client.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3f3f3f' }}>
                        <th style={{ ...s.th, paddingLeft: 0 }}>Keyword</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>Primary</th>
                        <th style={{ ...s.th, textAlign: 'right' }}>Search Volume</th>
                        <th style={s.th}>Related Keywords (Tool)</th>
                        <th style={s.th}>Selected Related Keywords</th>
                        <th style={s.th}>All Selected Keywords</th>
                        <th style={s.th}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientKeywords.map((kw: any) => {
                        const relatedKeywords = parseKeywordList(kw.related_keywords)
                        const selectedRelatedKeywords = parseKeywordList(kw.selected_related_keywords)
                        const allSelectedKeywords = parseKeywordList(kw.all_selected_keywords)
                        const isExpanded = expandedKeywordRows.has(kw.id)
                        const relatedPreview = isExpanded ? relatedKeywords : relatedKeywords.slice(0, 6)
                        const selectedPreview = isExpanded ? selectedRelatedKeywords : selectedRelatedKeywords.slice(0, 6)
                        const allSelectedPreview = isExpanded ? allSelectedKeywords : allSelectedKeywords.slice(0, 6)

                        return (
                          <tr key={kw.id}>
                            <td style={{ ...s.td, paddingLeft: 0, maxWidth: 220 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: kw.is_primary ? '#10a37f' : '#ececec', fontWeight: kw.is_primary ? 600 : 400 }}>
                                  {kw.keyword}
                                </span>
                                {(relatedKeywords.length > 6 || selectedRelatedKeywords.length > 6 || allSelectedKeywords.length > 6) && (
                                  <button
                                    onClick={() => toggleKeywordRowExpansion(kw.id)}
                                    style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid #3f3f3f', background: '#262626', color: '#8e8ea0', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                                  >
                                    {isExpanded ? 'Show less' : 'Show all'}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td style={s.td}>
                              <Badge status={kw.status} />
                            </td>
                            <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>
                              {kw.is_primary ? 'Yes' : 'No'}
                            </td>
                            <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                              {kw.search_volumes ? kw.search_volumes.toLocaleString() : '—'}
                            </td>
                            <td style={{ ...s.td, maxWidth: 260 }}>
                              {relatedKeywords.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {relatedPreview.map((item: string) => (
                                    <span key={item} style={{ fontSize: 11, color: '#60a5fa', background: '#0f1e2e', border: '1px solid #2a3f58', borderRadius: 999, padding: '2px 8px' }}>
                                      {item}
                                    </span>
                                  ))}
                                  {!isExpanded && relatedKeywords.length > 6 && (
                                    <span style={{ fontSize: 11, color: '#8e8ea0' }}>+{relatedKeywords.length - 6} more</span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#6b6b7b', fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ ...s.td, maxWidth: 260 }}>
                              {selectedRelatedKeywords.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {selectedPreview.map((item: string) => (
                                    <span key={item} style={{ fontSize: 11, color: '#10a37f', background: '#0d2e26', border: '1px solid #1d5b4c', borderRadius: 999, padding: '2px 8px' }}>
                                      {item}
                                    </span>
                                  ))}
                                  {!isExpanded && selectedRelatedKeywords.length > 6 && (
                                    <span style={{ fontSize: 11, color: '#8e8ea0' }}>+{selectedRelatedKeywords.length - 6} more</span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#6b6b7b', fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ ...s.td, maxWidth: 260 }}>
                              {allSelectedKeywords.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {allSelectedPreview.map((item: string) => (
                                    <span key={item} style={{ fontSize: 11, color: '#f59e0b', background: '#2a1f0a', border: '1px solid #5a4219', borderRadius: 999, padding: '2px 8px' }}>
                                      {item}
                                    </span>
                                  ))}
                                  {!isExpanded && allSelectedKeywords.length > 6 && (
                                    <span style={{ fontSize: 11, color: '#8e8ea0' }}>+{allSelectedKeywords.length - 6} more</span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#6b6b7b', fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>
                              {kw.created_at ? new Date(kw.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
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
        )}

        {newArticleOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 980, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) setNewArticleOpen(false) }}
          >
            <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 14, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #3f3f3f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Generate New Article
                  </div>
                  <div style={{ fontSize: 15, color: '#ececec', fontWeight: 600 }}>
                    Onboarding data autofilled for {client.name || client.domain}
                  </div>
                </div>
                <button onClick={() => setNewArticleOpen(false)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #3f3f3f', background: 'transparent', color: '#8e8ea0', cursor: 'pointer', fontSize: 13 }}>Close</button>
              </div>

              <div style={{ padding: 16, overflowY: 'auto' }}>
                {newArticleLoadingDefaults ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>Loading onboarding data...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <div>
                      <span style={s.fieldLabel}>Website URLs (autofilled)</span>
                      <textarea
                        value={newArticleForm.websiteUrls.join('\n')}
                        onChange={e => setNewArticleForm(prev => ({ ...prev, websiteUrls: e.target.value.split('\n').map(v => v.trim()).filter(Boolean) }))}
                        rows={4}
                        style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, padding: '10px 12px', color: '#ececec', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={s.fieldLabel}>Keywords (autofilled)</span>
                      <textarea
                        value={newArticleForm.keywords.join('\n')}
                        onChange={e => setNewArticleForm(prev => ({ ...prev, keywords: e.target.value.split('\n').map(v => v.trim()).filter(Boolean) }))}
                        rows={5}
                        style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, padding: '10px 12px', color: '#ececec', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={s.fieldLabel}>Client Context JSON (autofilled)</span>
                      <textarea
                        value={newArticleForm.contextRaw}
                        onChange={e => setNewArticleForm(prev => ({ ...prev, contextRaw: e.target.value }))}
                        rows={10}
                        style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, padding: '10px 12px', color: '#ececec', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '14px 16px', borderTop: '1px solid #3a3a3a', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setNewArticleOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={submitGeneratedArticle} disabled={newArticleSubmitting || newArticleLoadingDefaults} style={{ padding: '8px 18px', background: newArticleSubmitting ? '#0a2420' : '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: newArticleSubmitting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {newArticleSubmitting ? 'Generating...' : 'Trigger Article Generator'}
                </button>
              </div>
            </div>
          </div>
        )}

      </Card>
    </Layout>
  )
}