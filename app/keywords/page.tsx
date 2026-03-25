'use client'
// app/keywords/page.tsx
// PLACE THIS FILE AT: seo-onboarding/app/keywords/page.tsx  (NEW FILE)

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Card from '../../components/Card';
import Layout from '../../components/Layout';

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    scouted:    { bg: '#0f1e2e', color: '#60a5fa' },
    researched: { bg: '#2a1f0a', color: '#f59e0b' },
    used:       { bg: '#0d2e26', color: '#10a37f' },
    primary:    { bg: '#0d2e26', color: '#10a37f' },
    secondary:  { bg: '#2a2a2a', color: '#6b6b7b' },
  }
  const cfg = map[status.toLowerCase()] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: cfg.bg, color: cfg.color }}>
      {status}
    </span>
  )
}

const PAGE_SIZE = 15

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<any[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('All')
  const [page,     setPage]     = useState(1)

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = sb.from('keywords')
      .select('id, keyword, article_id, is_primary, status, search_volumes, query_score, clients(name, domain)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (status !== 'All') q = q.eq('status', status.toLowerCase())
    if (search.trim())    q = q.ilike('keyword', `%${search}%`)

    const { data, count } = await q
    setKeywords(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [search, status, page])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const ch = sb.channel('keywords-page-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'keywords' }, () => fetchData())
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [fetchData])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const pgBtn = (active: boolean) => ({
    width: 26, height: 26, borderRadius: 5,
    border: `1px solid ${active ? '#10a37f' : '#3f3f3f'}`,
    background: active ? '#10a37f' : 'transparent',
    color: active ? '#fff' : '#8e8ea0',
    cursor: 'pointer', fontSize: 12,
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
  })

  return (

      <Layout title="Keywords">

      <Card>
          <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <a href="/dashboard" style={{ fontSize: 13, color: '#6b6b7b', textDecoration: 'none', display: 'block', marginBottom: 4 }}>← Dashboard</a>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#ececec', letterSpacing: '-0.02em', marginBottom: 4 }}>Keywords</h2>
            <p style={{ fontSize: 13, color: '#8e8ea0' }}>{total.toLocaleString()} keywords tracked</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#0d2e26', border: '1px solid #155e4a', borderRadius: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10a37f' }} />
            <span style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace' }}>Live updates</span>
          </div>
        </div>

        <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search keywords..."
              style={{ flex: 1, minWidth: 200, background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 7, padding: '7px 12px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            {['All', 'Scouted', 'Researched', 'Used'].map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }} style={{
                padding: '5px 10px', borderRadius: 6, border: '1px solid #3f3f3f',
                background: status === s ? '#0d2e26' : '#2a2a2a',
                color: status === s ? '#10a37f' : '#8e8ea0',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>{s}</button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>Loading...</div>
            ) : keywords.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#6b6b7b', fontSize: 13 }}>
                {search || status !== 'All' ? 'No keywords match your filters' : 'No keywords yet'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #3f3f3f' }}>
                    {['Keyword', 'Article', 'Client', 'Type', 'Volume', 'Score', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keywords.map(row => {
                    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients
                    return (
                      <tr key={row.id}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a', color: row.is_primary ? '#10a37f' : '#ececec', fontWeight: row.is_primary ? 600 : 500 }}>
                          {row.keyword}
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a', color: '#6b6b7b', fontFamily: 'monospace', fontSize: 11 }}>#{row.article_id}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a', color: '#8e8ea0' }}>{client?.domain || '—'}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a' }}>
                          <Badge status={row.is_primary ? 'primary' : 'secondary'} />
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a', color: '#8e8ea0', fontFamily: 'monospace', fontSize: 12 }}>{(row.search_volumes || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a', color: '#8e8ea0', fontFamily: 'monospace', fontSize: 12 }}>{row.query_score ? Number(row.query_score).toFixed(2) : '—'}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a' }}><Badge status={row.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #2a2a2a' }}>
            <span style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace' }}>
              {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()}` : '0 results'}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgBtn(false)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={pgBtn(page === p)}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pgBtn(false)}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
      </Card>
      </Layout>


  
  )
}
