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
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 0, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: cfg.bg, color: cfg.color }}>
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

  const styles = {
    page: { minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: 24 },
    card: { background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20 },
    inp: { background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, padding: '7px 12px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    th: { padding: '8px 12px', textAlign: 'left' as const, color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const },
    td: { padding: '10px 12px', borderBottom: '1px solid #2a2a2a', color: '#8e8ea0', fontSize: 13 },
    pgBtn: (active: boolean) => ({ width: 26, height: 26, borderRadius: 5, border: `1px solid ${active ? '#10a37f' : '#3f3f3f'}`, background: active ? '#10a37f' : 'transparent', color: active ? '#fff' : '#8e8ea0', cursor: 'pointer', fontSize: 12, display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }),
  }

  return (
    <Layout title=' Articles' >
      <Card>

        <div style={styles.page}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <a href="/dashboard" style={{ fontSize: 13, color: '#6b6b7b', textDecoration: 'none' }}>← Dashboard</a>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: '#ececec', letterSpacing: '-0.02em', marginBottom: 4 }}>Articles</h2>
                <p style={{ fontSize: 13, color: '#8e8ea0' }}>{total.toLocaleString()} total articles</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#0d2e26', border: '1px solid #155e4a', borderRadius: 7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10a37f' }} />
                <span style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace' }}>Live updates</span>
              </div>
            </div>

            <div style={styles.card}>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search keyword, title, or client name..."
                  style={{ ...styles.inp, flex: 1, minWidth: 200 }}
                />
                {STATUSES.map(s => (
                  <button key={s} onClick={() => { setStatus(s); setPage(1) }} style={{
                    padding: '5px 10px', borderRadius: 6, border: '1px solid #3f3f3f',
                    background: status === s ? '#0d2e26' : '#2a2a2a',
                    color: status === s ? '#10a37f' : '#8e8ea0',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                  }}>{s}</button>
                ))}
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>Loading...</div>
                ) : articles.length === 0 ? (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>
                    {search || status !== 'All' ? 'No articles match your filters' : 'No articles yet — submit a client to start'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3f3f3f' }}>
                        {['ID', 'Client', 'Keyword', 'Status', 'Words', 'Type', 'Updated', 'Link'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map(row => {
                        const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
                        return (
                          <tr key={row.id} style={{ cursor: 'default' }}>
                            <td style={{ ...styles.td, color: '#6b6b7b', fontFamily: 'monospace', fontSize: 11 }}>#{row.id}</td>
                            <td style={{ ...styles.td, color: '#ececec', fontWeight: 500 }}>{client?.name || client?.domain || '—'}</td>
                            <td style={{ ...styles.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.keyword}</td>
                            <td style={styles.td}><Badge status={row.status} /></td>
                            <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{(row.target_word_count || 0).toLocaleString()}</td>
                            <td style={styles.td}>{row.content_type || '—'}</td>
                            <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 11, color: '#6b6b7b' }}>{timeAgo(row.updated_at)}</td>
                            <td style={styles.td}>
                              {row.wp_url && (
                                <a href={row.wp_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#10a37f', textDecoration: 'none', fontFamily: 'monospace' }}>↗ View</a>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #2a2a2a' }}>
                <span style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace' }}>
                  {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()}` : '0 results'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pgBtn(false)}>‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} style={styles.pgBtn(page === p)}>{p}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={styles.pgBtn(false)}>›</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Layout>

  )
}
