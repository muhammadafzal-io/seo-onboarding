'use client'
// app/create-article/page.tsx
// NEW FILE — keyword dropdown with SEO data panel

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ──────────────────────────────────────────────────────
type KeywordOption = {
  id: number; keyword: string; search_volumes: number; query_score: number
  competition: string; top_snippets: any; related_keywords: any; status: string
  clients: { id: number; name: string; domain: string } | null
}

type SeoData = {
  volume: number; score: number; competition: number
  topResults: Array<{ title: string; url: string; snippet: string }>
  relatedKeywords: string[]
  cached: boolean
}

// ── Keyword search dropdown ────────────────────────────────────
function KeywordDropdown({
  onSelect,
}: {
  onSelect: (kw: KeywordOption) => void
}) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<KeywordOption[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState<KeywordOption | null>(null)
  const timer  = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    const { data } = await sb.from('keywords')
      .select('id, keyword, search_volumes, query_score, competition, top_snippets, related_keywords, status, clients(id, name, domain)')
      .ilike('keyword', `%${q}%`)
      .not('status', 'eq', 'used')
      .order('search_volumes', { ascending: false })
      .limit(12)
    setResults((data || []) as any)
    setLoading(false)
    setOpen(true)
  }, [])

  const handleInput = (val: string) => {
    setQuery(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(val), 300)
    if (!val) { setSelected(null); setOpen(false) }
  }

  const pick = (kw: KeywordOption) => {
    setSelected(kw)
    setQuery(kw.keyword)
    setOpen(false)
    onSelect(kw)
  }

  const s: React.CSSProperties = { background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 8, padding: '9px 12px', color: '#ececec', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%' }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 14, pointerEvents: 'none' }}>⌕</span>
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search and select a keyword..."
          style={{ ...s, paddingLeft: 34 }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', border: '2px solid #3f3f3f', borderTopColor: '#10a37f', animation: 'spin 0.7s linear infinite' }} />
        )}
        {selected && (
          <button onClick={() => { setSelected(null); setQuery(''); setResults([]); }}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b6b7b', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #3f3f3f' }}>
            <span style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace' }}>
              {results.length} keywords found — sorted by search volume
            </span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {results.map(kw => {
              const client = Array.isArray(kw.clients) ? kw.clients[0] : kw.clients
              return (
                <div key={kw.id} onClick={() => pick(kw)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12, transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#ececec', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {kw.keyword}
                    </div>
                    {client && (
                      <div style={{ fontSize: 11, color: '#6b6b7b', marginTop: 2 }}>{client.name || client.domain}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    {kw.search_volumes > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#ececec', fontFamily: 'monospace', fontWeight: 500 }}>{kw.search_volumes.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: '#6b6b7b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>vol/mo</div>
                      </div>
                    )}
                    {kw.query_score > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#f59e0b', fontFamily: 'monospace', fontWeight: 500 }}>{Number(kw.query_score).toFixed(2)}</div>
                        <div style={{ fontSize: 9, color: '#6b6b7b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>score</div>
                      </div>
                    )}
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', background: kw.status === 'researched' ? '#2a1f0a' : '#0f1e2e', color: kw.status === 'researched' ? '#f59e0b' : '#60a5fa', alignSelf: 'center' }}>
                      {kw.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 10, marginTop: 4, padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#6b6b7b', fontSize: 13 }}>No keywords found for "{query}"</p>
        </div>
      )}
    </div>
  )
}

// ── SEO Data Panel ─────────────────────────────────────────────
function SeoPanel({ keyword }: { keyword: KeywordOption | null }) {
  if (!keyword) return null

  const topSnippets   = (() => { try { return Array.isArray(keyword.top_snippets) ? keyword.top_snippets : JSON.parse(keyword.top_snippets || '[]') } catch { return [] } })()
  const relatedKws    = (() => { try { return Array.isArray(keyword.related_keywords) ? keyword.related_keywords : JSON.parse(keyword.related_keywords || '[]') } catch { return [] } })()
  const competition   = keyword.competition ? Math.round(Math.min(1, Number(keyword.competition)) * 100) : null
  const diffColor     = competition !== null ? (competition > 66 ? '#f87171' : competition > 33 ? '#f59e0b' : '#10a37f') : '#6b6b7b'
  const diffLabel     = competition !== null ? (competition > 66 ? 'High' : competition > 33 ? 'Medium' : 'Low') : '—'

  const card: React.CSSProperties     = { background: '#262626', border: '1px solid #3f3f3f', borderRadius: 10, padding: 16 }
  const label: React.CSSProperties    = { fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }
  const metricNum: React.CSSProperties = { fontSize: 24, fontWeight: 600, color: '#ececec', letterSpacing: '-0.03em', lineHeight: 1 }

  return (
    <div style={{ background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20, marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10a37f' }} />
        <span style={{ fontSize: 12, color: '#10a37f', fontFamily: 'monospace', fontWeight: 500 }}>SEO Data</span>
        <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace', marginLeft: 'auto' }}>
          {keyword.search_volumes > 0 ? 'From database cache' : 'No data yet — will be fetched by WF1'}
        </span>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={card}>
          <span style={label}>Search Volume</span>
          <div style={metricNum}>{keyword.search_volumes > 0 ? keyword.search_volumes.toLocaleString() : '—'}</div>
          <div style={{ fontSize: 10, color: '#6b6b7b', marginTop: 4 }}>per month</div>
        </div>
        <div style={card}>
          <span style={label}>Query Score</span>
          <div style={{ ...metricNum, color: '#f59e0b' }}>{keyword.query_score ? Number(keyword.query_score).toFixed(2) : '—'}</div>
          <div style={{ fontSize: 10, color: '#6b6b7b', marginTop: 4 }}>0 = easy, 1 = hard</div>
        </div>
        <div style={card}>
          <span style={label}>Competition</span>
          <div style={{ ...metricNum, color: diffColor }}>{diffLabel}</div>
          {competition !== null && (
            <div style={{ height: 3, background: '#333', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: `${competition}%`, height: '100%', background: diffColor, borderRadius: 2 }} />
            </div>
          )}
        </div>
        <div style={card}>
          <span style={label}>Status</span>
          <div style={{ ...metricNum, fontSize: 18, color: keyword.status === 'researched' ? '#f59e0b' : keyword.status === 'used' ? '#10a37f' : '#60a5fa' }}>
            {keyword.status}
          </div>
          <div style={{ fontSize: 10, color: '#6b6b7b', marginTop: 4 }}>pipeline status</div>
        </div>
      </div>

      {/* Two-column: SERP results + related keywords */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Top SERP results */}
        <div style={card}>
          <span style={{ ...label, marginBottom: 10 }}>Top Competitors (SERP)</span>
          {topSnippets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topSnippets.slice(0, 5).map((r: any, i: number) => (
                <div key={i} style={{ borderBottom: '1px solid #333', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, color: '#d1d1d1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title || r.link || 'Result'}
                    </span>
                  </div>
                  {(r.link || r.url) && (
                    <div style={{ fontSize: 10, color: '#10a37f', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(r.link || r.url).replace(/^https?:\/\//, '').split('/')[0]}
                    </div>
                  )}
                  {r.snippet && (
                    <div style={{ fontSize: 11, color: '#6b6b7b', marginTop: 3, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.snippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#4a4a4a', fontSize: 12 }}>
              SERP data not yet fetched. WF1 will populate this on the next cycle.
            </div>
          )}
        </div>

        {/* Related keywords */}
        <div style={card}>
          <span style={{ ...label, marginBottom: 10 }}>Related Keywords</span>
          {relatedKws.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {relatedKws.slice(0, 20).map((kw: string, i: number) => (
                <span key={i} style={{ fontSize: 12, color: '#d1d1d1', background: '#333', padding: '3px 9px', borderRadius: 5, border: '1px solid #3f3f3f' }}>
                  {typeof kw === 'string' ? kw : (kw as any).keyword || JSON.stringify(kw)}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#4a4a4a', fontSize: 12 }}>
              Related keywords will appear here after WF1 runs.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function CreateArticlePage() {
  const [selectedKw,    setSelectedKw]    = useState<KeywordOption | null>(null)
  const [clients,       setClients]       = useState<Array<{ id: number; name: string; domain: string }>>([])
  const [form, setForm] = useState({
    clientId:       '',
    contentType:    'blog_post',
    targetWords:    '1500',
    targetAudience: '',
    language:       'English',
    notes:          '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    sb.from('clients').select('id, name, domain').order('name')
      .then(({ data }) => setClients(data || []))
  }, [])

  const handleKeywordSelect = (kw: KeywordOption) => {
    setSelectedKw(kw)
    const client = Array.isArray(kw.clients) ? kw.clients[0] : kw.clients
    setForm(f => ({
      ...f,
      clientId: client ? String(client.id) : f.clientId,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedKw) { setError('Please select a keyword'); return }
    if (!form.clientId) { setError('Please select a client'); return }
    setSubmitting(true); setError('')

    // Check if article already exists for this keyword + client
    const { data: existing } = await sb.from('articles')
      .select('id, status')
      .eq('client_id', Number(form.clientId))
      .eq('keyword_normalized', selectedKw.keyword.toLowerCase())
      .not('status', 'in', '("failed")')
      .limit(1)

    if (existing && existing.length > 0) {
      setError(`An article for "${selectedKw.keyword}" already exists (status: ${existing[0].status}). Duplicate creation prevented.`)
      setSubmitting(false)
      return
    }

    const imagePrompt = `Professional blog header image about: ${selectedKw.keyword}. Clean modern photography, no text.`
    const { error: insertError } = await sb.from('articles').insert({
      client_id:          Number(form.clientId),
      keyword:            selectedKw.keyword,
      keyword_normalized: selectedKw.keyword.toLowerCase(),
      status:             'scouted',
      target_word_count:  Number(form.targetWords),
      target_audience:    form.targetAudience || 'general audience',
      content_type:       form.contentType,
      language:           form.language,
      priority:           0,
      image_prompt:       imagePrompt,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  const inp: React.CSSProperties    = { background: '#2a2a2a', border: '1px solid #3f3f3f', borderRadius: 8, padding: '9px 12px', color: '#ececec', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%' }
  const sel: React.CSSProperties    = { ...inp, appearance: 'none', cursor: 'pointer', paddingRight: 28 }
  const label: React.CSSProperties  = { fontSize: 11, color: '#8e8ea0', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#212121', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 56, height: 56, background: '#0d2e26', border: '1px solid #10a37f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontSize: 22, color: '#ececec', marginBottom: 8 }}>Article queued</h2>
        <p style={{ color: '#8e8ea0', fontSize: 14, marginBottom: 24 }}>
          "{selectedKw?.keyword}" has been added to the pipeline. WF2 will pick it up in the next cycle.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a href="/articles" style={{ padding: '9px 20px', background: '#10a37f', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>View Articles</a>
          <button onClick={() => { setSubmitted(false); setSelectedKw(null); setForm(f => ({ ...f, targetAudience: '', notes: '' })) }}
            style={{ padding: '9px 20px', background: 'transparent', color: '#8e8ea0', border: '1px solid #3f3f3f', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Create Another
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <a href="/articles" style={{ fontSize: 12, color: '#6b6b7b', textDecoration: 'none', display: 'block', marginBottom: 12 }}>← Articles</a>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#ececec', letterSpacing: '-0.025em', marginBottom: 4 }}>Create Article</h1>
        <p style={{ fontSize: 13, color: '#8e8ea0', marginBottom: 28 }}>Select a researched keyword to queue a new article for generation.</p>

        <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 24 }}>

          {/* Keyword selector */}
          <div style={{ marginBottom: 20 }}>
            <span style={label}>Select Keyword *</span>
            <KeywordDropdown onSelect={handleKeywordSelect} />
          </div>

          {/* Form fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Client */}
            <div>
              <span style={label}>Client *</span>
              <div style={{ position: 'relative' }}>
                <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} style={sel}>
                  <option value="">— Select client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.domain}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 10, pointerEvents: 'none' }}>▾</span>
              </div>
            </div>

            {/* Content type */}
            <div>
              <span style={label}>Content Type</span>
              <div style={{ position: 'relative' }}>
                <select value={form.contentType} onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))} style={sel}>
                  {['blog_post', 'how_to', 'listicle', 'landing_page', 'case_study', 'product_page'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 10, pointerEvents: 'none' }}>▾</span>
              </div>
            </div>

            {/* Word count */}
            <div>
              <span style={label}>Target Word Count</span>
              <div style={{ position: 'relative' }}>
                <select value={form.targetWords} onChange={e => setForm(f => ({ ...f, targetWords: e.target.value }))} style={sel}>
                  {['800', '1200', '1500', '2000', '2500', '3000'].map(w => (
                    <option key={w} value={w}>{Number(w).toLocaleString()} words</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 10, pointerEvents: 'none' }}>▾</span>
              </div>
            </div>

            {/* Language */}
            <div>
              <span style={label}>Language</span>
              <div style={{ position: 'relative' }}>
                <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} style={sel}>
                  {['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German'].map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6b7b', fontSize: 10, pointerEvents: 'none' }}>▾</span>
              </div>
            </div>

            {/* Target audience */}
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={label}>Target Audience</span>
              <input value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                placeholder="e.g. small business owners, developers, healthcare professionals"
                style={inp} />
            </div>

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={label}>Additional Notes <span style={{ color: '#4a4a4a', textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>optional</span></span>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Special instructions, tone notes, topics to avoid..."
                rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 } as any} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#2a1515', border: '1px solid #5a2020', borderRadius: 8, color: '#f87171', fontSize: 13, fontFamily: 'monospace' }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSubmit} disabled={submitting || !selectedKw}
              style={{ padding: '10px 24px', background: selectedKw ? '#10a37f' : '#2a2a2a', color: selectedKw ? '#fff' : '#4a4a4a', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: selectedKw ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background .15s' }}>
              {submitting ? 'Queueing...' : '✦ Queue for Generation'}
            </button>
            <a href="/articles" style={{ fontSize: 13, color: '#6b6b7b', textDecoration: 'none' }}>Cancel</a>
          </div>
        </div>

        {/* SEO Panel */}
        <SeoPanel keyword={selectedKw} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
