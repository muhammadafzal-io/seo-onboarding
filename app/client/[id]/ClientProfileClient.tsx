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

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
<<<<<<< Updated upstream
    <div style={{ background: '#262626', border: '1px solid #3f3f3f', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: color || '#ececec', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
=======
      <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] py-[14px] px-[16px] min-w-0 overflow-hidden">
        <div className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[6px] truncate">{label}</div>
        <div className="text-[28px] font-semibold tracking-[-0.04em] leading-none truncate" style={{ color: color || '#ececec' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
        {entries.map(e => {
          const pct = total > 0 ? (statCounts[e.key] / total) * 100 : 0
          return <div key={e.key} style={{ width: `${pct}%`, background: e.color }} title={`${e.key}: ${statCounts[e.key]}`} />
        })}
=======
      <div>
        <div className="flex h-[8px] rounded-[4px] overflow-hidden mb-[10px]">
          {entries.map(e => {
            const pct = total > 0 ? (statCounts[e.key] / total) * 100 : 0
            return <div key={e.key} style={{ width: `${pct}%`, background: e.color }} title={`${e.key}: ${statCounts[e.key]}`} />
          })}
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {entries.map(e => (
              <div key={e.key} className="flex items-center gap-[5px] min-w-0">
                <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: e.color }} />
                <span className="text-[11px] text-[#8e8ea0] truncate">{e.key}: {statCounts[e.key]}</span>
              </div>
          ))}
        </div>
>>>>>>> Stashed changes
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
    const isInProgress = recentArticles.some(a => a.status === 'scouted' || a.status === 'researched') ||
      recentKeywords.some(k => k.article_status === 'scouted');

    if (isInProgress) {
      const pollInterval = setInterval(() => {
        // 2. Set up a poll to check every 5 seconds
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

<<<<<<< Updated upstream
  const s = {
    section: { background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#ececec', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 8 },
    field: { fontSize: 13, color: '#ececec', fontWeight: 500 },
    fieldLabel: { fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, display: 'block' },
    th: { padding: '8px 12px', textAlign: 'left', color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', fontWeight: 500 },
    td: { padding: '10px 12px', borderBottom: '1px solid #2a2a2a', fontSize: 13, color: '#8e8ea0', verticalAlign: 'middle' },
  } as const
=======
  // Common Tailwind classes
  const sectionClasses = "bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] p-[20px] mb-[16px] min-w-0 overflow-hidden responsive-section"
  const sectionTitleClasses = "text-[13px] font-semibold text-[#ececec] mb-[14px] pb-[10px] border-b border-[#2a2a2a] flex items-center gap-[8px] min-w-0"
  const thClasses = "py-[8px] px-[12px] text-left text-[#6b6b7b] text-[11px] font-mono uppercase tracking-[0.06em] whitespace-nowrap font-medium"
  const tdClasses = "py-[10px] px-[12px] border-b border-[#2a2a2a] text-[13px] text-[#8e8ea0] align-middle whitespace-nowrap"
>>>>>>> Stashed changes

  const initials = (client.name || client.domain || 'C').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const niche = client.niche || 'General'

  const reviewableCount = recentArticles.filter((a: any) => REVIEWABLE_STATUSES.includes(a.status)).length

  return (
<<<<<<< Updated upstream
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
=======
      <Layout title="Client Profile">
        {/* HYBRID CSS OVERRIDES FOR MOBILE/TABLET */}
        <style>{`
          /* 1. minmax(0, 1fr) completely prevents grid blowouts on mobile! */
          @media (max-width: 1023px) {
            .responsive-page { padding: 16px !important; }
            .responsive-main-grid { grid-template-columns: minmax(0, 1fr) !important; }
          }
          @media (max-width: 768px) {
            .responsive-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            /* Stack header elements perfectly on mobile to prevent overflow */
            .responsive-header-card { flex-direction: column !important; gap: 16px !important; padding: 16px !important; }
            .responsive-header-actions { flex-wrap: wrap !important; width: 100%; }
            .responsive-section { padding: 16px !important; }
            .table-wrapper { overflow-x: auto !important; max-width: 100%; padding-bottom: 8px !important; }
          }
          @media (max-width: 480px) {
            .responsive-details-grid { grid-template-columns: minmax(0, 1fr) !important; }
            .responsive-article-item { flex-wrap: wrap !important; }
          }
        `}</style>

        <Card>
          {publishingKw && (
              <KeywordPublishModal
                  keyword={publishingKw}
                  onClose={() => setPublishingKw(null)}
                  onSuccess={handlePublishSuccess}
              />
          )}

          <div className="min-h-screen bg-[#212121] text-[#ececec] [font-family:'Instrument_Sans',system-ui,sans-serif] p-[24px] responsive-page overflow-x-hidden">
            <div className="max-w-[1100px] mx-auto min-w-0">

              {/* Breadcrumb - Added flex-wrap */}
              <div className="flex items-center gap-[6px] mb-[20px] text-[12px] text-[#6b6b7b] flex-wrap min-w-0">
                <a href="/dashboard" className="text-[#6b6b7b] no-underline hover:text-[#ececec] transition-colors shrink-0">Dashboard</a>
                <span className="shrink-0">›</span>
                <a href="/clients" className="text-[#6b6b7b] no-underline hover:text-[#ececec] transition-colors shrink-0">Clients</a>
                <span className="shrink-0">›</span>
                <span className="text-[#ececec] truncate">{client.name || client.domain}</span>
              </div>

              {/* Profile header */}
              <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[14px] p-[24px] mb-[16px] flex gap-[20px] items-start responsive-header-card min-w-0">
                <div className="w-[64px] h-[64px] rounded-[14px] bg-[linear-gradient(135deg,#10a37f,#0d6e5a)] flex items-center justify-center text-[22px] font-bold text-white shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[10px] flex-wrap mb-[4px]">
                    <h1 className="text-[20px] font-semibold text-[#ececec] tracking-[-0.02em] m-0 truncate">{client.name || client.domain}</h1>
                    <span className="text-[11px] text-[#10a37f] bg-[#0d2e26] py-[2px] px-[8px] rounded-[5px] font-mono shrink-0">{niche}</span>
                  </div>
                  {client.domain && (
                      <a href={`https://${client.domain}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#10a37f] no-underline font-mono hover:underline break-all">
                        ↗ {client.domain}
                      </a>
                  )}
                  <div className="flex gap-[16px] mt-[10px] flex-wrap">
                    {client.email && <span className="text-[12px] text-[#8e8ea0] break-all">✉ {client.email}</span>}
                    {client.schedule && <span className="text-[12px] text-[#8e8ea0]">◷ {client.schedule}</span>}
                    {client.publish_platform && <span className="text-[12px] text-[#8e8ea0]">◈ {client.publish_platform}</span>}
                    <span className="text-[12px] text-[#6b6b7b] font-mono shrink-0">
>>>>>>> Stashed changes
                    Client since {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
<<<<<<< Updated upstream
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a href={`/articles?clientId=${client.id}`} style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Articles</a>
                <a href={`/keywords?clientId=${client.id}`} style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Keywords</a>
                <a href={`/create-article?clientId=${client.id}`} style={{ padding: '7px 14px', background: '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>+ Article</a>
              </div>
            </div>

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
=======


                <div className="flex gap-[8px] shrink-0 responsive-header-actions">
                  <a href={`/articles?clientId=${client.id}`} className="py-[7px] px-[14px] bg-[#2a2a2a] border border-[#3f3f3f] rounded-[7px] text-[#8e8ea0] text-[12px] no-underline font-medium hover:bg-[#333] transition-colors whitespace-nowrap inline-flex items-center justify-center">Articles</a>
                  <a href={`/keywords?clientId=${client.id}`} className="py-[7px] px-[14px] bg-[#2a2a2a] border border-[#3f3f3f] rounded-[7px] text-[#8e8ea0] text-[12px] no-underline font-medium hover:bg-[#333] transition-colors whitespace-nowrap inline-flex items-center justify-center">Keywords</a>
                  <a href={`/create-article?clientId=${client.id}`} className="py-[7px] px-[14px] bg-[#10a37f] border-none rounded-[7px] text-[#ececec] text-[12px] no-underline font-semibold hover:bg-[#0e916f] transition-colors whitespace-nowrap inline-flex items-center justify-center">+ Article</a>
                </div>
              </div>

              {/* KPI stats */}
              <div className="grid grid-cols-4 gap-[10px] mb-[16px] responsive-kpi-grid">
                <StatCard label="Total Articles" value={stats.totalArticles} />
                <StatCard label="Published" value={stats.published} color="#10a37f" />
                <StatCard label="In Pipeline" value={stats.totalArticles - stats.published - stats.failed} color="#f59e0b" />
                <StatCard label="Total Keywords" value={stats.totalKeywords} />
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-2 gap-[16px] responsive-main-grid min-w-0">

                {/* Left Column */}
                <div className="min-w-0">
                  <div className={sectionClasses}>
                    <div className={sectionTitleClasses}><span>◈</span> Article Status</div>
                    {stats.totalArticles > 0
                        ? <StatusBar statCounts={statCounts} total={stats.totalArticles} />
                        : <p className="text-[13px] text-[#4a4a4a] text-center py-[16px] m-0">No articles yet</p>
                    }
                  </div>

                  <div className={sectionClasses}>
                    <div className={sectionTitleClasses}><span>◇</span> Client Details</div>
                    <div className="grid grid-cols-2 gap-[14px] responsive-details-grid min-w-0">
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
                          <div key={f.label} className="min-w-0">
                            <span className="text-[11px] text-[#6b6b7b] font-mono uppercase tracking-[0.06em] mb-[3px] block truncate">{f.label}</span>
                            <div className="text-[13px] text-[#ececec] font-medium break-all">{f.val}</div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="min-w-0">
                  {/* ── Recent Articles List ── */}
                  <div className={sectionClasses}>
                    <div className={`${sectionTitleClasses} justify-between flex-wrap`}>
                    <span className="flex items-center gap-[8px] flex-wrap min-w-0">
                      <span className="shrink-0">◈</span>
                      <span className="truncate">Recent Articles</span>
                      {reviewableCount > 0 && (
                          <span className="text-[9px] text-[#fb923c] bg-[#2a1a10] py-[2px] px-[7px] rounded-[4px] font-mono border border-[#5a3010] whitespace-nowrap">
>>>>>>> Stashed changes
                          {reviewableCount} need review
                        </span>
                      )}
                    </span>
<<<<<<< Updated upstream
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
=======
                      <a href={`/articles?clientId=${client.id}`} className="text-[11px] text-[#10a37f] no-underline font-mono font-normal hover:underline whitespace-nowrap shrink-0">View all →</a>
                    </div>

                    {recentArticles.length === 0 ? (
                        <p className="text-[13px] text-[#4a4a4a] text-center py-[16px] m-0">No articles yet</p>
                    ) : recentArticles.map((a: any) => {
                      const canReview = REVIEWABLE_STATUSES.includes(a.status)
                      return (
                          <div key={a.id} className="flex items-center gap-[10px] py-[9px] border-b border-[#2a2a2a] responsive-article-item min-w-0">
                            <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: STATUS_STYLE[a.status]?.color || '#6b6b7b' }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] text-[#d1d1d1] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                                {a.meta_title || a.keyword}
                              </div>
                              <div className="text-[11px] text-[#4a4a4a] font-mono truncate">{timeAgo(a.updated_at)}</div>
                            </div>

                            <div className="flex items-center gap-[8px] shrink-0">
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
                  {/* ── Keywords table ── */}
                  <div className={sectionClasses}>
                    <div className={`${sectionTitleClasses} justify-between`}>
                      <span className="flex items-center gap-[8px] min-w-0"><span className="shrink-0">◇</span> <span className="truncate">Keywords</span></span>
                      <a href={`/keywords?clientId=${client.id}`} className="text-[11px] text-[#10a37f] no-underline font-mono font-normal hover:underline whitespace-nowrap shrink-0">View all →</a>
                    </div>

                    {recentKeywords.length === 0 ? (
                        <p className="text-[13px] text-[#4a4a4a] text-center py-[16px] m-0">No keywords yet</p>
                    ) : (
                        <div className="table-wrapper">
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
                                                className="py-[4px] px-[12px] bg-[#10a37f] border-none rounded-[6px] text-white text-[11px] font-semibold cursor-pointer font-inherit hover:bg-[#0e916f] transition-colors whitespace-nowrap"
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
                        </div>
                    )}
                  </div>
>>>>>>> Stashed changes
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Layout>
  )
}