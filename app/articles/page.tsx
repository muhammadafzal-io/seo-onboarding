'use client'
// app/articles/page.tsx
// PLACE THIS FILE AT: seo-onboarding/app/articles/page.tsx  (NEW FILE)
// This is a CLIENT component — it fetches real data from Supabase
// and subscribes to Realtime so the table updates automatically.

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Layout from '../../components/Layout';
import Card from '../../components/Card';

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    published: { bg: '#0d2e26', color: '#10a37f' },
    approved: { bg: '#1a2e1a', color: '#4ade80' },
    written: { bg: '#1a1a2e', color: '#a78bfa' },
    processing: { bg: '#2a1f0a', color: '#f59e0b' },
    scouted: { bg: '#0f1e2e', color: '#60a5fa' },
    failed: { bg: '#2a1515', color: '#f87171' },
    need_revision: { bg: '#2a1f2a', color: '#d946ef' },
  }
  const cfg = map[status.toLowerCase()] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
      <span
          className="inline-flex py-[2px] px-[8px] rounded-none text-[11px] font-medium font-mono"
          style={{ background: cfg.bg, color: cfg.color }}
      >
      {status}
    </span>
  )
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUSES = ['All', 'Scouted', 'Processing', 'Written', 'Approved', 'Published', 'Failed']
const PAGE_SIZE = 10

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = useCallback(async () => {
    setLoading(true)

    // --- FIX: Search by client name using a two-step approach ---
    // Supabase .or() only works on the primary table's columns.
    // To search by client name, we first find matching client IDs,
    // then include client_id.in.(...) in the .or() filter.
    let matchingClientIds: number[] = []

    if (search.trim()) {
      const { data: matchedClients } = await sb
          .from('clients')
          .select('id')
          .ilike('name', `%${search.trim()}%`)

      if (matchedClients && matchedClients.length > 0) {
        matchingClientIds = matchedClients.map((c: any) => c.id)
      }
    }

    let q = sb.from('articles')
        .select('id, keyword, meta_title, status, target_word_count, content_type, updated_at, wp_url, clients(name, domain)', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (status !== 'All') q = q.eq('status', status.toLowerCase())

    if (search.trim()) {
      // Build the OR filter including keyword, meta_title, and matching client IDs
      const orParts = [
        `keyword.ilike.%${search.trim()}%`,
        `meta_title.ilike.%${search.trim()}%`,
      ]

      if (matchingClientIds.length > 0) {
        orParts.push(`client_id.in.(${matchingClientIds.join(',')})`)
      }

      q = q.or(orParts.join(','))
    }

    const { data, count } = await q
    setArticles(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [search, status, page])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const ch = sb.channel('articles-page-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => fetchData())
        .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [fetchData])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Shared Table Classes
  const thClass = "py-[8px] px-[12px] text-left text-[#6b6b7b] text-[11px] font-mono uppercase tracking-[0.06em] whitespace-nowrap"
  const tdClass = "py-[10px] px-[12px] border-b border-[#2a2a2a] text-[#8e8ea0] text-[13px]"

  return (
      <Layout title="Articles">
        <Card>
          <div className="min-h-screen bg-[#212121] text-[#ececec] [font-family:'Instrument_Sans',system-ui,sans-serif] p-[24px]">
            <div className="max-w-[1200px] mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-[20px]">
                <div>
                  <div className="flex items-center gap-[12px] mb-[4px]">
                    <a href="/dashboard" className="text-[13px] text-[#6b6b7b] no-underline hover:text-[#ececec] transition-colors">← Dashboard</a>
                  </div>
                  <h2 className="text-[20px] font-semibold text-[#ececec] tracking-[-0.02em] mb-[4px]">Articles</h2>
                  <p className="text-[13px] text-[#8e8ea0] m-0">{total.toLocaleString()} total articles</p>
                </div>
                <div className="flex items-center gap-[6px] py-[5px] px-[12px] bg-[#0d2e26] border border-[#155e4a] rounded-[7px]">
                  <div className="w-[6px] h-[6px] rounded-full bg-[#10a37f]" />
                  <span className="text-[11px] text-[#10a37f] font-mono">Live updates</span>
                </div>
              </div>

              <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] p-[20px]">
                {/* Filters */}
                <div className="flex gap-[8px] mb-[14px] flex-wrap">
                  <input
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1) }}
                      placeholder="Search keyword, title, or client name..."
                      className="flex-1 min-w-[200px] bg-[#2a2a2a] border border-[#3f3f3f] rounded-[7px] py-[7px] px-[12px] text-[#ececec] text-[13px] outline-none font-inherit focus:border-[#10a37f] transition-colors"
                  />
                  {STATUSES.map(s => (
                      <button
                          key={s}
                          onClick={() => { setStatus(s); setPage(1) }}
                          className={`py-[5px] px-[10px] rounded-[6px] border border-[#3f3f3f] text-[12px] cursor-pointer font-inherit transition-all duration-[120ms] hover:brightness-110 ${
                              status === s
                                  ? 'bg-[#0d2e26] text-[#10a37f]'
                                  : 'bg-[#2a2a2a] text-[#8e8ea0]'
                          }`}
                      >
                        {s}
                      </button>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                      <div className="py-[48px] text-center text-[#6b6b7b] text-[13px]">Loading...</div>
                  ) : articles.length === 0 ? (
                      <div className="py-[48px] text-center text-[#6b6b7b] text-[13px]">
                        {search || status !== 'All' ? 'No articles match your filters' : 'No articles yet — submit a client to start'}
                      </div>
                  ) : (
                      <table className="w-full border-collapse">
                        <thead>
                        <tr className="border-b border-[#3f3f3f]">
                          {['ID', 'Client', 'Keyword', 'Status', 'Words', 'Type', 'Updated', 'Link'].map(h => (
                              <th key={h} className={thClass}>{h}</th>
                          ))}
                        </tr>
                        </thead>
                        <tbody>
                        {articles.map(row => {
                          const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
                          return (
                              <tr key={row.id} className="cursor-default hover:bg-[#2a2a2a] transition-colors">
                                <td className={`${tdClass} text-[#6b6b7b] font-mono text-[11px]`}>#{row.id}</td>
                                <td className={`${tdClass} text-[#ececec] font-medium`}>{client?.name || client?.domain || '—'}</td>
                                <td className={`${tdClass} max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}>{row.keyword}</td>
                                <td className={tdClass}><Badge status={row.status} /></td>
                                <td className={`${tdClass} font-mono text-[12px]`}>{(row.target_word_count || 0).toLocaleString()}</td>
                                <td className={tdClass}>{row.content_type || '—'}</td>
                                <td className={`${tdClass} font-mono text-[11px] text-[#6b6b7b]`}>{timeAgo(row.updated_at)}</td>
                                <td className={tdClass}>
                                  {row.wp_url && (
                                      <a href={row.wp_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#10a37f] no-underline font-mono hover:underline">↗ View</a>
                                  )}
                                </td>
                              </tr>
                          )
                        })}
                        </tbody>
                      </table>
                  )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-[14px] pt-[12px] border-t border-[#2a2a2a]">
                <span className="text-[11px] text-[#6b6b7b] font-mono">
                  {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()}` : '0 results'}
                </span>
                  <div className="flex gap-[4px]">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-[26px] h-[26px] rounded-[5px] border border-[#3f3f3f] bg-transparent text-[#8e8ea0] cursor-pointer text-[12px] flex items-center justify-center transition-colors hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-[26px] h-[26px] rounded-[5px] border cursor-pointer text-[12px] flex items-center justify-center transition-colors ${
                                page === p
                                    ? 'border-[#10a37f] bg-[#10a37f] text-white'
                                    : 'border-[#3f3f3f] bg-transparent text-[#8e8ea0] hover:bg-[#333]'
                            }`}
                        >
                          {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="w-[26px] h-[26px] rounded-[5px] border border-[#3f3f3f] bg-transparent text-[#8e8ea0] cursor-pointer text-[12px] flex items-center justify-center transition-colors hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Layout>
  )
}