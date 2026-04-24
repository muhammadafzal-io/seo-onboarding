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
      <span className="inline-flex py-[2px] px-[8px] rounded-[5px] text-[11px] font-medium font-mono whitespace-nowrap" style={{ background: cfg.bg, color: cfg.color }}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
      <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] py-[14px] px-[16px]">
        <div className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[6px]">{label}</div>
        <div className="text-[28px] font-semibold tracking-[-0.04em] leading-none" style={{ color: color || '#ececec' }}>
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
        <div className="flex h-[8px] rounded-[4px] overflow-hidden mb-[10px]">
          {entries.map(e => {
            const pct = total > 0 ? (statCounts[e.key] / total) * 100 : 0
            return <div key={e.key} style={{ width: `${pct}%`, background: e.color }} title={`${e.key}: ${statCounts[e.key]}`} />
          })}
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {entries.map(e => (
              <div key={e.key} className="flex items-center gap-[5px]">
                <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: e.color }} />
                <span className="text-[11px] text-[#8e8ea0]">{e.key}: {statCounts[e.key]}</span>
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

  // Common Tailwind classes replacing the old `s` object
  const sectionClasses = "bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] p-[20px] mb-[16px]"
  const sectionTitleClasses = "text-[13px] font-semibold text-[#ececec] mb-[14px] pb-[10px] border-b border-[#2a2a2a] flex items-center gap-[8px]"
  const thClasses = "py-[8px] px-[12px] text-left text-[#6b6b7b] text-[11px] font-mono uppercase tracking-[0.06em] whitespace-nowrap font-medium"
  const tdClasses = "py-[10px] px-[12px] border-b border-[#2a2a2a] text-[13px] text-[#8e8ea0] align-middle"

  const initials = (client.name || client.domain || 'C').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const niche = client.niche || 'General'

  const reviewableCount = recentArticles.filter((a: any) => REVIEWABLE_STATUSES.includes(a.status)).length

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

          <div className="min-h-screen bg-[#212121] text-[#ececec] [font-family:'Instrument_Sans',system-ui,sans-serif] p-[24px]">
            <div className="max-w-[1100px] mx-auto">

              {/* Breadcrumb */}
              <div className="flex items-center gap-[6px] mb-[20px] text-[12px] text-[#6b6b7b]">
                <a href="/dashboard" className="text-[#6b6b7b] no-underline hover:text-[#ececec] transition-colors">Dashboard</a>
                <span>›</span>
                <a href="/clients" className="text-[#6b6b7b] no-underline hover:text-[#ececec] transition-colors">Clients</a>
                <span>›</span>
                <span className="text-[#ececec]">{client.name || client.domain}</span>
              </div>

              {/* Profile header */}
              <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[14px] p-[24px] mb-[16px] flex gap-[20px] items-start">
                <div className="w-[64px] h-[64px] rounded-[14px] bg-[linear-gradient(135deg,#10a37f,#0d6e5a)] flex items-center justify-center text-[22px] font-bold text-white shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[10px] flex-wrap mb-[4px]">
                    <h1 className="text-[20px] font-semibold text-[#ececec] tracking-[-0.02em] m-0">{client.name || client.domain}</h1>
                    <span className="text-[11px] text-[#10a37f] bg-[#0d2e26] py-[2px] px-[8px] rounded-[5px] font-mono">{niche}</span>
                  </div>
                  {client.domain && (
                      <a href={`https://${client.domain}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#10a37f] no-underline font-mono hover:underline">
                        ↗ {client.domain}
                      </a>
                  )}
                  <div className="flex gap-[16px] mt-[10px] flex-wrap">
                    {client.email && <span className="text-[12px] text-[#8e8ea0]">✉ {client.email}</span>}
                    {client.schedule && <span className="text-[12px] text-[#8e8ea0]">◷ {client.schedule}</span>}
                    {client.publish_platform && <span className="text-[12px] text-[#8e8ea0]">◈ {client.publish_platform}</span>}
                    <span className="text-[12px] text-[#6b6b7b] font-mono">
                    Client since {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  </div>
                </div>
                <div className="flex gap-[8px] shrink-0">
                  <a href={`/articles?clientId=${client.id}`} className="py-[7px] px-[14px] bg-[#2a2a2a] border border-[#3f3f3f] rounded-[7px] text-[#8e8ea0] text-[12px] no-underline font-medium hover:bg-[#333] transition-colors">Articles</a>
                  <a href={`/keywords?clientId=${client.id}`} className="py-[7px] px-[14px] bg-[#2a2a2a] border border-[#3f3f3f] rounded-[7px] text-[#8e8ea0] text-[12px] no-underline font-medium hover:bg-[#333] transition-colors">Keywords</a>
                  <a href={`/create-article?clientId=${client.id}`} className="py-[7px] px-[14px] bg-[#10a37f] border-none rounded-[7px] text-[#ececec] text-[12px] no-underline font-semibold hover:bg-[#0e916f] transition-colors">+ Article</a>
                </div>
              </div>

              {/* KPI stats */}
              <div className="grid grid-cols-4 gap-[10px] mb-[16px]">
                <StatCard label="Total Articles" value={stats.totalArticles} />
                <StatCard label="Published" value={stats.published} color="#10a37f" />
                <StatCard label="In Pipeline" value={stats.totalArticles - stats.published - stats.failed} color="#f59e0b" />
                <StatCard label="Total Keywords" value={stats.totalKeywords} />
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-2 gap-[16px]">

                {/* Left Column */}
                <div>
                  <div className={sectionClasses}>
                    <div className={sectionTitleClasses}><span>◈</span> Article Status</div>
                    {stats.totalArticles > 0
                        ? <StatusBar statCounts={statCounts} total={stats.totalArticles} />
                        : <p className="text-[13px] text-[#4a4a4a] text-center py-[16px] m-0">No articles yet</p>
                    }
                  </div>

                  <div className={sectionClasses}>
                    <div className={sectionTitleClasses}><span>◇</span> Client Details</div>
                    <div className="grid grid-cols-2 gap-[14px]">
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
                            <span className="text-[11px] text-[#6b6b7b] font-mono uppercase tracking-[0.06em] mb-[3px] block">{f.label}</span>
                            <div className="text-[13px] text-[#ececec] font-medium">{f.val}</div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  {/* ── Recent Articles List ── */}
                  <div className={sectionClasses}>
                    <div className={`${sectionTitleClasses} justify-between`}>
                    <span className="flex items-center gap-[8px]">
                      <span>◈</span>
                      Recent Articles
                      {reviewableCount > 0 && (
                          <span className="text-[9px] text-[#fb923c] bg-[#2a1a10] py-[2px] px-[7px] rounded-[4px] font-mono border border-[#5a3010]">
                          {reviewableCount} need review
                        </span>
                      )}
                    </span>
                      <a href={`/articles?clientId=${client.id}`} className="text-[11px] text-[#10a37f] no-underline font-mono font-normal hover:underline">View all →</a>
                    </div>

                    {recentArticles.length === 0 ? (
                        <p className="text-[13px] text-[#4a4a4a] text-center py-[16px] m-0">No articles yet</p>
                    ) : recentArticles.map((a: any) => {
                      const canReview = REVIEWABLE_STATUSES.includes(a.status)
                      return (
                          <div key={a.id} className="flex items-center gap-[10px] py-[9px] border-b border-[#2a2a2a]">
                            <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: STATUS_STYLE[a.status]?.color || '#6b6b7b' }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] text-[#d1d1d1] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                                {a.meta_title || a.keyword}
                              </div>
                              <div className="text-[11px] text-[#4a4a4a] font-mono">{timeAgo(a.updated_at)}</div>
                            </div>

                            <div className="flex items-center gap-[8px]">
                              {canReview ? (
                                  <a
                                      href={`/articles/${a.id}/review`}
                                      className={`py-[3px] px-[10px] rounded-[6px] text-[11px] font-semibold no-underline whitespace-nowrap font-inherit border hover:opacity-80 transition-opacity ${
                                          a.status === 'need_revision'
                                              ? 'bg-[#2a1515] border-[#5a2020] text-[#f87171]'
                                              : 'bg-[#2a1a10] border-[#5a3010] text-[#fb923c]'
                                      }`}
                                  >
                                    {a.status === 'need_revision' ? '↩ Revision' : '◻ Review'}
                                  </a>
                              ) : a.status === 'approved' ? (
                                  <span className="text-[11px] text-[#4ade80] font-mono bg-[#1a2e1a] py-[3px] px-[8px] rounded-[5px]">✓ Approved</span>
                              ) : a.status === 'published' && a.wp_url ? (
                                  <a
                                      href={a.wp_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-[#10a37f] font-mono no-underline hover:underline"
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
                  <div className={sectionClasses}>
                    <div className={`${sectionTitleClasses} justify-between`}>
                      <span className="flex items-center gap-[8px]"><span>◇</span> Keywords</span>
                      <a href={`/keywords?clientId=${client.id}`} className="text-[11px] text-[#10a37f] no-underline font-mono font-normal hover:underline">View all →</a>
                    </div>

                    {recentKeywords.length === 0 ? (
                        <p className="text-[13px] text-[#4a4a4a] text-center py-[16px] m-0">No keywords yet</p>
                    ) : (
                        <table className="w-full border-collapse">
                          <thead>
                          <tr className="border-b border-[#3f3f3f]">
                            <th className={`${thClasses} pl-0`}>Keyword</th>
                            <th className={`${thClasses} text-right`}>Vol</th>
                            <th className={`${thClasses} text-right`}>Action</th>
                          </tr>
                          </thead>
                          <tbody>
                          {recentKeywords.map((kw: any) => {
                            const isQueued = queuedIds.has(kw.id)
                            const articleStatus = kw.article_status ?? null
                            const canPublish = articleStatus === 'new' && !isQueued

                            return (
                                <tr key={kw.id} className="transition-colors hover:bg-[#2a2a2a]">
                                  <td className={`${tdClasses} pl-0 max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap ${kw.is_primary ? 'text-[#10a37f] font-semibold' : 'text-[#d1d1d1] font-normal'}`}>
                                    {kw.keyword}
                                  </td>
                                  <td className={`${tdClasses} text-right font-mono text-[12px]`}>
                                    {kw.search_volumes > 0 ? kw.search_volumes.toLocaleString() : '—'}
                                  </td>
                                  <td className={`${tdClasses} text-right`}>
                                    <div className="flex justify-end items-center gap-[8px]">
                                      {isQueued ? (
                                          <span className="text-[11px] text-[#10a37f] font-mono bg-[#0d2e26] py-[3px] px-[8px] rounded-[5px]">✓ Queued</span>
                                      ) : canPublish ? (
                                          <button
                                              onClick={() => setPublishingKw({ ...kw, client_id: client.id })}
                                              className="py-[4px] px-[12px] bg-[#10a37f] border-none rounded-[6px] text-white text-[11px] font-semibold cursor-pointer font-inherit hover:bg-[#0e916f] transition-colors"
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
        </Card>
      </Layout>
  )
}