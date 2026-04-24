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

  return (
      <div ref={wrapRef} className="relative">
        <div className="relative">
          <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[14px] pointer-events-none">⌕</span>
          <input
              value={query}
              onChange={e => handleInput(e.target.value)}
              onFocus={() => query.length >= 2 && setOpen(true)}
              placeholder="Search and select a keyword..."
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-[8px] py-[9px] pr-[12px] pl-[34px] text-[#ececec] text-[14px] outline-none font-inherit transition-colors focus:border-[#10a37f]"
          />
          {loading && (
              <div className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full border-2 border-[#3f3f3f] border-t-[#10a37f] animate-spin" />
          )}
          {selected && (
              <button onClick={() => { setSelected(null); setQuery(''); setResults([]); }}
                      className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none text-[#6b6b7b] cursor-pointer text-[14px] leading-none hover:text-[#ececec] transition-colors">
                ✕
              </button>
          )}
        </div>

        {open && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-[#2a2a2a] border border-[#3f3f3f] rounded-[10px] mt-[4px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="py-[8px] px-[12px] pb-[6px] border-b border-[#3f3f3f]">
            <span className="text-[11px] text-[#6b6b7b] font-mono">
              {results.length} keywords found — sorted by search volume
            </span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {results.map(kw => {
                  const client = Array.isArray(kw.clients) ? kw.clients[0] : kw.clients
                  return (
                      <div key={kw.id} onClick={() => pick(kw)}
                           className="py-[10px] px-[14px] cursor-pointer border-b border-[#333] flex items-center gap-[12px] transition-colors hover:bg-[#333]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-[#ececec] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                            {kw.keyword}
                          </div>
                          {client && (
                              <div className="text-[11px] text-[#6b6b7b] mt-[2px]">{client.name || client.domain}</div>
                          )}
                        </div>
                        <div className="flex gap-[10px] shrink-0">
                          {kw.search_volumes > 0 && (
                              <div className="text-right">
                                <div className="text-[12px] text-[#ececec] font-mono font-medium">{kw.search_volumes.toLocaleString()}</div>
                                <div className="text-[9px] text-[#6b6b7b] uppercase tracking-[0.05em]">vol/mo</div>
                              </div>
                          )}
                          {kw.query_score > 0 && (
                              <div className="text-right">
                                <div className="text-[12px] text-[#f59e0b] font-mono font-medium">{Number(kw.query_score).toFixed(2)}</div>
                                <div className="text-[9px] text-[#6b6b7b] uppercase tracking-[0.05em]">score</div>
                              </div>
                          )}
                          <span className="text-[9px] py-[2px] px-[6px] rounded-[4px] font-mono self-center"
                                style={{ background: kw.status === 'researched' ? '#2a1f0a' : '#0f1e2e', color: kw.status === 'researched' ? '#f59e0b' : '#60a5fa' }}>
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
            <div className="absolute top-full left-0 right-0 z-50 bg-[#2a2a2a] border border-[#3f3f3f] rounded-[10px] mt-[4px] p-[20px] text-center">
              <p className="text-[#6b6b7b] text-[13px] m-0">No keywords found for "{query}"</p>
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

  return (
      <div className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-[12px] p-[20px] mt-[20px]">
        <div className="flex items-center gap-[8px] mb-[16px]">
          <div className="w-[6px] h-[6px] rounded-full bg-[#10a37f]" />
          <span className="text-[12px] text-[#10a37f] font-mono font-medium">SEO Data</span>
          <span className="text-[11px] text-[#4a4a4a] font-mono ml-auto">
          {keyword.search_volumes > 0 ? 'From database cache' : 'No data yet — will be fetched by WF1'}
        </span>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-[12px] mb-[16px]">
          <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] p-[16px]">
            <span className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[4px] block">Search Volume</span>
            <div className="text-[24px] font-semibold text-[#ececec] tracking-[-0.03em] leading-none">{keyword.search_volumes > 0 ? keyword.search_volumes.toLocaleString() : '—'}</div>
            <div className="text-[10px] text-[#6b6b7b] mt-[4px]">per month</div>
          </div>
          <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] p-[16px]">
            <span className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[4px] block">Query Score</span>
            <div className="text-[24px] font-semibold text-[#f59e0b] tracking-[-0.03em] leading-none">{keyword.query_score ? Number(keyword.query_score).toFixed(2) : '—'}</div>
            <div className="text-[10px] text-[#6b6b7b] mt-[4px]">0 = easy, 1 = hard</div>
          </div>
          <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] p-[16px]">
            <span className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[4px] block">Competition</span>
            <div className="text-[24px] font-semibold tracking-[-0.03em] leading-none" style={{ color: diffColor }}>{diffLabel}</div>
            {competition !== null && (
                <div className="h-[3px] bg-[#333] rounded-[2px] mt-[8px] overflow-hidden">
                  <div className="h-full rounded-[2px]" style={{ width: `${competition}%`, background: diffColor }} />
                </div>
            )}
          </div>
          <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] p-[16px]">
            <span className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[4px] block">Status</span>
            <div className="text-[18px] font-semibold tracking-[-0.03em] leading-none" style={{ color: keyword.status === 'researched' ? '#f59e0b' : keyword.status === 'used' ? '#10a37f' : '#60a5fa' }}>
              {keyword.status}
            </div>
            <div className="text-[10px] text-[#6b6b7b] mt-[4px]">pipeline status</div>
          </div>
        </div>

        {/* Two-column: SERP results + related keywords */}
        <div className="grid grid-cols-2 gap-[12px]">

          {/* Top SERP results */}
          <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] p-[16px]">
            <span className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[10px] block">Top Competitors (SERP)</span>
            {topSnippets.length > 0 ? (
                <div className="flex flex-col gap-[10px]">
                  {topSnippets.slice(0, 5).map((r: any, i: number) => (
                      <div key={i} className="border-b border-[#333] pb-[8px]">
                        <div className="flex items-baseline gap-[6px] mb-[3px]">
                          <span className="text-[10px] text-[#6b6b7b] font-mono shrink-0">#{i + 1}</span>
                          <span className="text-[12px] text-[#d1d1d1] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                      {r.title || r.link || 'Result'}
                    </span>
                        </div>
                        {(r.link || r.url) && (
                            <div className="text-[10px] text-[#10a37f] font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                              {(r.link || r.url).replace(/^https?:\/\//, '').split('/')[0]}
                            </div>
                        )}
                        {r.snippet && (
                            <div className="text-[11px] text-[#6b6b7b] mt-[3px] leading-[1.5] line-clamp-2">
                              {r.snippet}
                            </div>
                        )}
                      </div>
                  ))}
                </div>
            ) : (
                <div className="py-[16px] text-center text-[#4a4a4a] text-[12px]">
                  SERP data not yet fetched. WF1 will populate this on the next cycle.
                </div>
            )}
          </div>

          {/* Related keywords */}
          <div className="bg-[#262626] border border-[#3f3f3f] rounded-[10px] p-[16px]">
            <span className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[10px] block">Related Keywords</span>
            {relatedKws.length > 0 ? (
                <div className="flex flex-wrap gap-[6px]">
                  {relatedKws.slice(0, 20).map((kw: string, i: number) => (
                      <span key={i} className="text-[12px] text-[#d1d1d1] bg-[#333] py-[3px] px-[9px] rounded-[5px] border border-[#3f3f3f]">
                  {typeof kw === 'string' ? kw : (kw as any).keyword || JSON.stringify(kw)}
                </span>
                  ))}
                </div>
            ) : (
                <div className="py-[16px] text-center text-[#4a4a4a] text-[12px]">
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

  // Input styles mapping
  const inputClass = "w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-[8px] py-[9px] px-[12px] text-[#ececec] text-[14px] outline-none font-inherit transition-colors focus:border-[#10a37f]"
  const selectClass = `${inputClass} appearance-none cursor-pointer pr-[28px]`
  const labelClass = "text-[11px] text-[#8e8ea0] font-mono uppercase tracking-[0.06em] block mb-[6px]"

  if (submitted) return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center font-sans">
        <div className="text-center max-w-[400px]">
          <div className="w-[56px] h-[56px] bg-[#0d2e26] border border-[#10a37f] rounded-full flex items-center justify-center text-[24px] mx-auto mb-[20px]">✓</div>
          <h2 className="text-[22px] text-[#ececec] mb-[8px]">Article queued</h2>
          <p className="text-[#8e8ea0] text-[14px] mb-[24px]">
            "{selectedKw?.keyword}" has been added to the pipeline. WF2 will pick it up in the next cycle.
          </p>
          <div className="flex gap-[10px] justify-center">
            <a href="/articles" className="py-[9px] px-[20px] bg-[#10a37f] text-white rounded-[8px] no-underline text-[13px] font-semibold hover:bg-[#0e916f] transition-colors">View Articles</a>
            <button onClick={() => { setSubmitted(false); setSelectedKw(null); setForm(f => ({ ...f, targetAudience: '', notes: '' })) }}
                    className="py-[9px] px-[20px] bg-transparent text-[#8e8ea0] border border-[#3f3f3f] rounded-[8px] text-[13px] cursor-pointer font-inherit hover:text-[#ececec] hover:border-[#6b6b7b] transition-colors">
              Create Another
            </button>
          </div>
        </div>
      </div>
  )

  return (
      <div className="min-h-screen bg-[#212121] text-[#ececec] [font-family:'Instrument_Sans',system-ui,sans-serif] p-[24px]">
        <div className="max-w-[900px] mx-auto">
          <a href="/articles" className="text-[12px] text-[#6b6b7b] no-underline block mb-[12px] hover:text-[#ececec] transition-colors">← Articles</a>
          <h1 className="text-[22px] font-semibold text-[#ececec] tracking-[-0.025em] mb-[4px]">Create Article</h1>
          <p className="text-[13px] text-[#8e8ea0] mb-[28px]">Select a researched keyword to queue a new article for generation.</p>

          <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] p-[24px]">

            {/* Keyword selector */}
            <div className="mb-[20px]">
              <span className={labelClass}>Select Keyword *</span>
              <KeywordDropdown onSelect={handleKeywordSelect} />
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-[16px]">

              {/* Client */}
              <div>
                <span className={labelClass}>Client *</span>
                <div className="relative">
                  <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={selectClass}>
                    <option value="">— Select client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.domain}</option>)}
                  </select>
                  <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[10px] pointer-events-none">▾</span>
                </div>
              </div>

              {/* Content type */}
              <div>
                <span className={labelClass}>Content Type</span>
                <div className="relative">
                  <select value={form.contentType} onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))} className={selectClass}>
                    {['blog_post', 'how_to', 'listicle', 'landing_page', 'case_study', 'product_page'].map(t => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[10px] pointer-events-none">▾</span>
                </div>
              </div>

              {/* Word count */}
              <div>
                <span className={labelClass}>Target Word Count</span>
                <div className="relative">
                  <select value={form.targetWords} onChange={e => setForm(f => ({ ...f, targetWords: e.target.value }))} className={selectClass}>
                    {['800', '1200', '1500', '2000', '2500', '3000'].map(w => (
                        <option key={w} value={w}>{Number(w).toLocaleString()} words</option>
                    ))}
                  </select>
                  <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[10px] pointer-events-none">▾</span>
                </div>
              </div>

              {/* Language */}
              <div>
                <span className={labelClass}>Language</span>
                <div className="relative">
                  <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className={selectClass}>
                    {['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German'].map(l => (
                        <option key={l}>{l}</option>
                    ))}
                  </select>
                  <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#6b6b7b] text-[10px] pointer-events-none">▾</span>
                </div>
              </div>

              {/* Target audience */}
              <div className="col-span-2">
                <span className={labelClass}>Target Audience</span>
                <input value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                       placeholder="e.g. small business owners, developers, healthcare professionals"
                       className={inputClass} />
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <span className={labelClass}>Additional Notes <span className="text-[#4a4a4a] normal-case tracking-normal text-[10px]">optional</span></span>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Special instructions, tone notes, topics to avoid..."
                          rows={3} className={`${inputClass} resize-y leading-[1.6]`} />
              </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mt-[16px] py-[10px] px-[14px] bg-[#2a1515] border border-[#5a2020] rounded-[8px] text-[#f87171] text-[13px] font-mono">
                  ⚠ {error}
                </div>
            )}

            {/* Submit */}
            <div className="mt-[20px] flex gap-[10px] items-center">
              <button onClick={handleSubmit} disabled={submitting || !selectedKw}
                      className={`py-[10px] px-[24px] border-none rounded-[8px] text-[14px] font-semibold font-inherit transition-colors ${selectedKw ? 'bg-[#10a37f] text-white cursor-pointer hover:bg-[#0e916f]' : 'bg-[#2a2a2a] text-[#4a4a4a] cursor-not-allowed'}`}>
                {submitting ? 'Queueing...' : '✦ Queue for Generation'}
              </button>
              <a href="/articles" className="text-[13px] text-[#6b6b7b] no-underline hover:text-[#ececec] transition-colors">Cancel</a>
            </div>
          </div>

          {/* SEO Panel */}
          <SeoPanel keyword={selectedKw} />
        </div>
      </div>
  )
}