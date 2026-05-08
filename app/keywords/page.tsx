'use client'
// app/keywords/page.tsx — updated with client search fix

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Layout from '../../components/Layout'
import Card from '../../components/Card'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Keyword = {
  id: number; keyword: string; article_id: number; is_primary: boolean
  status: string; search_volumes: number; query_score: number; competition: string
  clients: { id: number; name: string; domain: string } | null
}
type ClientOption = { id: number; name: string; domain: string }

const PAGE_SIZE = 15

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  scouted: { bg: '#0f1e2e', color: '#60a5fa' },
  researched: { bg: '#2a1f0a', color: '#f59e0b' },
  used: { bg: '#0d2e26', color: '#10a37f' },
  primary: { bg: '#0d2e26', color: '#10a37f' },
  secondary: { bg: '#2a2a2a', color: '#6b6b7b' },
}
function Badge({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status?.toLowerCase()] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [clientId, setClientId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    sb.from('clients').select('id, name, domain').order('name')
      .then(({ data }) => setClients(data || []))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)

    let q = sb.from('keywords')
      .select('id, keyword, article_id, is_primary, status, search_volumes, query_score, competition, clients(id, name, domain)', { count: 'exact' })
      .order('search_volumes', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (status !== 'All') q = q.eq('status', status.toLowerCase())
    if (clientId) q = q.eq('client_id', clientId)

    // --- FIX: search by keyword AND client name ---
    if (search.trim()) {
      // Step 1: find clients whose name matches the search term
      const { data: matchedClients } = await sb
        .from('clients')
        .select('id')
        .ilike('name', `%${search.trim()}%`)

      const matchingClientIds = (matchedClients || []).map((c: any) => c.id)

      // Step 2: build .or() with keyword.ilike + client_id.in.(ids)
      const orParts: string[] = [
        `keyword.ilike.%${search.trim()}%`,
      ]

      if (matchingClientIds.length > 0) {
        orParts.push(`client_id.in.(${matchingClientIds.join(',')})`)
      }

      q = q.or(orParts.join(','))
    }

    const { data, count } = await q
    setKeywords((data || []) as any)
    setTotal(count || 0)
    setLoading(false)
  }, [search, status, clientId, page])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const ch = sb.channel('keywords-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'keywords' }, () => fetchData())
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [fetchData])

  const handleSearch = (val: string) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1) }, 300)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const activeClient = clients.find(c => c.id === clientId)

<<<<<<< Updated upstream
  const inp: React.CSSProperties = { background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, padding: '0 12px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit', height: 34 }
  const sel: React.CSSProperties = { ...inp, appearance: 'none', cursor: 'pointer', paddingRight: 28 }
  const th: React.CSSProperties = { padding: '8px 14px', textAlign: 'left', color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', fontWeight: 500 }
  const td: React.CSSProperties = { padding: '11px 14px', borderBottom: '1px solid #2a2a2a', fontSize: 13, color: '#8e8ea0', verticalAlign: 'middle' }
  const pgb = (active: boolean): React.CSSProperties => ({ width: 28, height: 28, borderRadius: 6, border: `1px solid ${active ? '#10a37f' : '#3f3f3f'}`, background: active ? '#10a37f' : 'transparent', color: active ? '#fff' : '#8e8ea0', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' })

  return (
    <Layout title='Keywords'>
      <Card>
        <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: 24 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <a href="/dashboard" style={{ fontSize: 12, color: '#6b6b7b', textDecoration: 'none', display: 'block', marginBottom: 6 }}>← Dashboard</a>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: '#ececec', letterSpacing: '-0.025em', margin: 0 }}>
                  Keywords
                  {activeClient && (
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#10a37f', marginLeft: 10, fontFamily: 'monospace' }}>
                      {activeClient.domain}
                    </span>
                  )}
                </h1>
                <p style={{ fontSize: 13, color: '#8e8ea0', marginTop: 4 }}>
                  {total.toLocaleString()} keyword{total !== 1 ? 's' : ''}{clientId ? ' for this client' : ' across all clients'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#0d2e26', border: '1px solid #155e4a', borderRadius: 7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10a37f', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace', fontWeight: 500 }}>Live</span>
=======
  // Tailwind class variables to replace inline style objects
  const inpClass = "bg-[#2a2a2a] border border-[#3f3f3f] rounded-[7px] px-[12px] text-[#ececec] text-[13px] outline-none font-inherit h-[34px] focus:border-[#10a37f] transition-colors"
  const selClass = `${inpClass} appearance-none cursor-pointer pr-[28px]`
  const thClass = "py-[8px] px-[14px] text-left text-[#6b6b7b] text-[11px] font-mono uppercase tracking-[0.06em] whitespace-nowrap font-medium"

  const tdClass = "py-[11px] px-[14px] border-b border-[#2a2a2a] text-[13px] text-[#8e8ea0] align-middle whitespace-nowrap"

  const pgb = (active: boolean) => `w-[28px] h-[28px] rounded-[6px] border text-[12px] flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
      active ? 'border-[#10a37f] bg-[#10a37f] text-white' : 'border-[#3f3f3f] bg-transparent text-[#8e8ea0] hover:bg-[#333]'
  }`

  return (
      <Layout title="Keywords">

        <style>{`
          @media (max-width: 1023px) {
            .responsive-page { padding: 16px !important; }
          }
          @media (max-width: 768px) {
            .responsive-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
            .responsive-title-row { flex-wrap: wrap !important; }
            .responsive-filters { flex-direction: column !important; gap: 8px !important; align-items: stretch !important; }
            .responsive-search-input { width: 100% !important; min-width: 0 !important; }
            .responsive-select-wrapper { width: 100% !important; min-width: 0 !important; }
            .responsive-select { width: 100% !important; min-width: 0 !important; }
            .table-wrapper { padding-bottom: 12px !important; }
            .responsive-pagination { flex-direction: column !important; gap: 12px !important; align-items: center !important; }
          }
        `}</style>

        <Card>
          <div className="min-h-screen bg-[#212121] text-[#ececec] [font-family:'Instrument_Sans',system-ui,sans-serif] p-[24px] responsive-page">
            <div className="max-w-[1280px] mx-auto min-w-0">

              {/* Header */}
              <div className="flex items-start justify-between mb-[24px] responsive-header min-w-0">
                <div className="min-w-0">
                  <a href="/dashboard" className="text-[12px] text-[#6b6b7b] no-underline block mb-[6px] hover:text-[#ececec] transition-colors">← Dashboard</a>
                  <h1 className="text-[22px] font-semibold text-[#ececec] tracking-[-0.025em] m-0 flex items-center responsive-title-row min-w-0">
                    <span className="shrink-0">Keywords</span>
                    {activeClient && (
                        <span className="text-[13px] font-normal text-[#10a37f] ml-[10px] font-mono truncate">
                      {activeClient.domain}
                    </span>
                    )}
                  </h1>
                  <p className="text-[13px] text-[#8e8ea0] mt-[4px] mb-0 truncate">
                    {total.toLocaleString()} keyword{total !== 1 ? 's' : ''}{clientId ? ' for this client' : ' across all clients'}
                  </p>
                </div>
                <div className="flex items-center gap-[6px] py-[5px] px-[12px] bg-[#0d2e26] border border-[#155e4a] rounded-[7px] shrink-0">
                  <div className="w-[6px] h-[6px] rounded-full bg-[#10a37f] animate-pulse" />
                  <span className="text-[11px] text-[#10a37f] font-mono font-medium">Live</span>
                </div>
              </div>

              <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] p-[20px] min-w-0 overflow-hidden">
                {/* Filters */}
                <div className="flex gap-[8px] mb-[16px] flex-wrap items-center responsive-filters min-w-0">
                  <div className="relative flex-1 min-w-[200px] responsive-search-input">
                    <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[13px] pointer-events-none">⌕</span>
                    <input
                        placeholder="Search keywords or client name..."
                        onChange={e => handleSearch(e.target.value)}
                        className={`${inpClass} w-full pl-[30px]`}
                    />
                  </div>

                  <div className="relative responsive-select-wrapper shrink-0">
                    <select
                        value={clientId ?? ''}
                        onChange={e => { setClientId(e.target.value ? Number(e.target.value) : null); setPage(1) }}
                        className={`${selClass} min-w-[180px] responsive-select`}
                    >
                      <option value="">All Clients</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.domain}</option>)}
                    </select>
                    <span className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[10px] pointer-events-none">▾</span>
                  </div>

                  <div className="relative responsive-select-wrapper shrink-0">
                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); setPage(1) }}
                        className={`${selClass} min-w-[140px] responsive-select`}
                    >
                      {['All', 'Scouted', 'Researched', 'Used'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <span className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[10px] pointer-events-none">▾</span>
                  </div>

                  {(clientId || status !== 'All') && (
                      <button
                          onClick={() => { setClientId(null); setStatus('All'); setPage(1) }}
                          className="px-[12px] h-[34px] rounded-[7px] border border-[#5a2020] bg-[#2a1515] text-[#f87171] text-[12px] cursor-pointer font-inherit hover:bg-[#3f1d1d] transition-colors shrink-0"
                      >
                        ✕ Clear
                      </button>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto table-wrapper">
                  {loading ? (
                      <div className="py-[56px] text-center text-[#6b6b7b] text-[13px]">
                        <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3f3f3f] border-t-[#10a37f] mx-auto mb-[12px] animate-spin" />
                        Loading keywords...
                      </div>
                  ) : keywords.length === 0 ? (
                      <div className="py-[64px] text-center">
                        <div className="text-[32px] mb-[12px] text-[#6b6b7b]">◇</div>
                        <p className="text-[#6b6b7b] text-[14px] m-0">No keywords found</p>
                        <p className="text-[#4a4a4a] text-[12px] mt-[4px] mb-0">
                          {search || status !== 'All' || clientId ? 'Try adjusting your filters' : 'Keywords appear here after client onboarding'}
                        </p>
                      </div>
                  ) : (
                      <table className="w-full border-collapse">
                        <thead>
                        <tr className="border-b border-[#3f3f3f]">
                          <th className={thClass}>Keyword</th>
                          <th className={thClass}>Client</th>
                          <th className={thClass}>Article</th>
                          <th className={thClass}>Type</th>
                          <th className={thClass}>Volume</th>
                          <th className={thClass}>Score</th>
                          <th className={thClass}>Competition</th>
                          <th className={thClass}>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {keywords.map(row => {
                          const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
                          return (
                              <tr key={row.id} className="transition-colors hover:bg-[#2a2a2a]">
                                <td className={`${tdClass} max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap ${row.is_primary ? 'text-[#10a37f] font-semibold' : 'text-[#ececec] font-medium'}`}>
                                  {row.keyword}
                                </td>
                                <td className={`${tdClass} max-w-[140px]`}>
                                  {client ? (
                                      <a href={`/client/${client.id}`} className="text-[#d1d1d1] no-underline overflow-hidden text-ellipsis whitespace-nowrap block hover:text-[#ececec] transition-colors">
                                        {client.name || client.domain}
                                      </a>
                                  ) : '—'}
                                </td>
                                <td className={`${tdClass} font-mono text-[11px] text-[#4a4a4a]`}>
                                  <a href={`/blog/${row.article_id}`} className="text-[#60a5fa] no-underline hover:underline">#{row.article_id}</a>
                                </td>
                                <td className={tdClass}><Badge status={row.is_primary ? 'primary' : 'secondary'} /></td>
                                <td className={`${tdClass} font-mono text-[12px]`}>{(row.search_volumes || 0).toLocaleString()}</td>
                                <td className={`${tdClass} font-mono text-[12px]`}>{row.query_score ? Number(row.query_score).toFixed(2) : '—'}</td>
                                <td className={`${tdClass} font-mono text-[12px]`}>{(row.competition || 0).toLocaleString()}</td>
                                <td className={tdClass}><Badge status={row.status} /></td>
                              </tr>
                          )
                        })}
                        </tbody>
                      </table>
                  )}
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="flex items-center justify-between mt-[14px] pt-[12px] border-t border-[#2a2a2a] responsive-pagination">
                  <span className="text-[12px] text-[#6b6b7b] font-mono shrink-0">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
                  </span>
                      <div className="flex gap-[4px] flex-wrap justify-center">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pgb(false)}>‹</button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => Math.max(1, Math.min(page - 2, totalPages - 4)) + i).map(p => (
                            <button key={p} onClick={() => setPage(p)} className={pgb(page === p)}>{p}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={pgb(false)}>›</button>
                      </div>
                    </div>
                )}
>>>>>>> Stashed changes
              </div>
            </div>

            <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20 }}>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 13, pointerEvents: 'none' }}>⌕</span>
                  <input placeholder="Search keywords or client name..." onChange={e => handleSearch(e.target.value)} style={{ ...inp, width: '100%', paddingLeft: 30 }} />
                </div>

                <div style={{ position: 'relative' }}>
                  <select value={clientId ?? ''} onChange={e => { setClientId(e.target.value ? Number(e.target.value) : null); setPage(1) }} style={{ ...sel, minWidth: 180 }}>
                    <option value="">All Clients</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.domain}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 10, pointerEvents: 'none' }}>▾</span>
                </div>

                <div style={{ position: 'relative' }}>
                  <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ ...sel, minWidth: 140 }}>
                    {['All', 'Scouted', 'Researched', 'Used'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 10, pointerEvents: 'none' }}>▾</span>
                </div>

                {(clientId || status !== 'All') && (
                  <button onClick={() => { setClientId(null); setStatus('All'); setPage(1) }}
                    style={{ padding: '0 12px', height: 34, borderRadius: 7, border: '1px solid #5a2020', background: '#2a1515', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '56px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #3f3f3f', borderTopColor: '#10a37f', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
                    Loading keywords...
                  </div>
                ) : keywords.length === 0 ? (
                  <div style={{ padding: '64px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>◇</div>
                    <p style={{ color: '#6b6b7b', fontSize: 14 }}>No keywords found</p>
                    <p style={{ color: '#4a4a4a', fontSize: 12, marginTop: 4 }}>
                      {search || status !== 'All' || clientId ? 'Try adjusting your filters' : 'Keywords appear here after client onboarding'}
                    </p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3f3f3f' }}>
                        <th style={th}>Keyword</th>
                        <th style={th}>Client</th>
                        <th style={th}>Article</th>
                        <th style={th}>Type</th>
                        <th style={th}>Volume</th>
                        <th style={th}>Score</th>
                        <th style={th}>Competition</th>
                        <th style={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map(row => {
                        const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
                        return (
                          <tr key={row.id}
                            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            style={{ transition: 'background .1s' }}
                          >
                            <td style={{ ...td, color: row.is_primary ? '#10a37f' : '#ececec', fontWeight: row.is_primary ? 600 : 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.keyword}
                            </td>
                            <td style={{ ...td, maxWidth: 140 }}>
                              {client ? (
                                <a href={`/client/${client.id}`} style={{ color: '#d1d1d1', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                  {client.name || client.domain}
                                </a>
                              ) : '—'}
                            </td>
                            <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#4a4a4a' }}>
                              <a href={`/blog/${row.article_id}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>#{row.article_id}</a>
                            </td>
                            <td style={td}><Badge status={row.is_primary ? 'primary' : 'secondary'} /></td>
                            <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{(row.search_volumes || 0).toLocaleString()}</td>
                            <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{row.query_score ? Number(row.query_score).toFixed(2) : '—'}</td>
                            <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{(row.competition || 0).toLocaleString()}</td>
                            <td style={td}><Badge status={row.status} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {total > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #2a2a2a' }}>
                  <span style={{ fontSize: 12, color: '#6b6b7b', fontFamily: 'monospace' }}>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgb(false)}>‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => Math.max(1, Math.min(page - 2, totalPages - 4)) + i).map(p => (
                      <button key={p} onClick={() => setPage(p)} style={pgb(page === p)}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pgb(false)}>›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      </Card>
    </Layout>
  )
}
