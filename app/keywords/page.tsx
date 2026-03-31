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

// function CompetitionBar({ value }: { value: string }) {
//   const pct = Math.round(Math.min(1, value) * 100)
//   const color = pct > 66 ? '#f87171' : pct > 33 ? '#f59e0b' : '#10a37f'
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//       <div style={{ width: 48, height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
//         <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
//       </div>
//       <span style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace' }}>{pct}%</span>
//     </div>
//   )
// }

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
