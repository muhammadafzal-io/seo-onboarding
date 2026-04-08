'use client'
// components/KeywordPublishModal.tsx
// Shows rich related_keywords with score/volume/role badges
// User can select from scored keywords OR type custom keywords
// Sends selected + custom keywords to /api/publish-keyword → WF2

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────
type RelatedKeyword = {
  keyword:    string
  score:      number
  volume:     number
  competition: string
  cpc:        number
  usage_role: string
  is_paa:     boolean
  is_serp_related: boolean
  source:     string
}

type KeywordRow = {
  id:                number
  keyword:           string
  article_id?:       number | null
  client_id:         number
  search_volumes?:   number
  competition?:      number
  competition_label?: string
  query_score?:      number
  opportunity_grade?: string
  cpc?:              number
  related_keywords?: string | RelatedKeyword[] | null
  status:            string
  article_status?:   string | null
}

type Props = {
  keyword:   KeywordRow
  onClose:   () => void
  onSuccess: (keywordId: number) => void
}

// ── Helpers ───────────────────────────────────────────────────
function parseRelatedKeywords(raw: any): RelatedKeyword[] {
  try {
    if (!raw) return []
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(arr)) return []
    return arr.filter((k: any) => k?.keyword)
  } catch { return [] }
}

function roleColor(role: string) {
  if (role === 'H2_heading_keyword') return { bg: '#0d2e26', color: '#10a37f', label: 'H2' }
  if (role === 'body_keyword')       return { bg: '#1a1a2e', color: '#a78bfa', label: 'Body' }
  return                                    { bg: '#2a1f0a', color: '#f59e0b', label: 'Support' }
}

function compColor(comp: string) {
  if (comp === 'LOW')    return '#10a37f'
  if (comp === 'MEDIUM') return '#f59e0b'
  return '#f87171'
}

// ── Component ─────────────────────────────────────────────────
export default function KeywordPublishModal({ keyword, onClose, onSuccess }: Props) {
  const relatedList = parseRelatedKeywords(keyword.related_keywords)

  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [customInput, setCustomInput] = useState('')
  const [customKws,   setCustomKws]   = useState<string[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [step,        setStep]        = useState<'select' | 'done'>('select')

  // ── Selection handlers ──────────────────────────────────────
  const toggleRelated = (kw: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(kw) ? next.delete(kw) : next.add(kw)
    return next
  })

  const selectAll  = () => setSelected(new Set(relatedList.map(k => k.keyword)))
  const clearAll   = () => setSelected(new Set())

  const addCustom  = () => {
    const val = customInput.trim()
    if (!val || customKws.includes(val)) return
    setCustomKws(prev => [...prev, val])
    setCustomInput('')
  }

  const removeCustom = (kw: string) => setCustomKws(prev => prev.filter(k => k !== kw))

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustom() }
  }

  // Total keywords that will be sent
  const allSelected    = [...Array.from(selected), ...customKws]
  const totalKeywords  = 1 + allSelected.length  // +1 for primary

  // ── Submit ──────────────────────────────────────────────────
  const handleConfirm = async () => {
    setLoading(true)
    setError('')

    const resolvedKeywordId = keyword.id       ?? null
    const resolvedArticleId = keyword.article_id ?? null
    const resolvedClientId  = keyword.client_id ?? null
    const resolvedMainKw    = keyword.keyword   ?? null

    const missing: string[] = []
    if (!resolvedKeywordId) missing.push('keyword_id')
    if (!resolvedClientId)  missing.push('client_id')
    if (!resolvedMainKw)    missing.push('main_keyword')

    if (missing.length > 0) {
      setError(`Missing fields: ${missing.join(', ')}`)
      setLoading(false)
      return
    }

    const all_keywords = [resolvedMainKw, ...allSelected]

    try {
      const payload = {
        keyword_id:        resolvedKeywordId,
        article_id:        resolvedArticleId,
        client_id:         resolvedClientId,
        main_keyword:      resolvedMainKw,
        selected_keywords: allSelected,
        all_keywords,
      }


      const res  = await fetch('/api/publish-keyword', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      console.log('res', res)

      const text = await res.text()
    

      let data: any
      try { data = JSON.parse(text) }
      catch { throw new Error(`Non-JSON response:\n${text}`) }

      if (!res.ok) throw new Error(data.error || 'Failed to queue article')

      setStep('done')
      setTimeout(() => { onSuccess(resolvedKeywordId); onClose() }, 1800)

    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Styles ───────────────────────────────────────────────────
  const headerCompColor = compColor(keyword.competition_label || '')

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #3a3a3a', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Queue Article for WF2
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#ececec', letterSpacing: '-0.02em', margin: 0 }}>
                {keyword.keyword}
              </h2>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b6b7b', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, marginTop: -4 }}>✕</button>
          </div>

          {/* SEO metrics */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Volume',      val: (keyword.search_volumes || 0).toLocaleString(),                     color: '#60a5fa' },
              { label: 'Competition', val: keyword.competition_label || '—',                                    color: headerCompColor },
              { label: 'CPC',         val: keyword.cpc ? `$${keyword.cpc}` : '—',                             color: '#f59e0b' },
              { label: 'Score',       val: keyword.query_score ? Number(keyword.query_score).toFixed(0) : '—', color: '#a78bfa' },
              { label: 'Grade',       val: keyword.opportunity_grade || '—',                                    color: '#10a37f' },
              { label: 'Keywords',    val: `${totalKeywords} selected`,                                         color: '#fb923c' },
            ].map(m => (
              <div key={m.label} style={{ background: '#262626', border: '1px solid #3a3a3a', borderRadius: 7, padding: '6px 12px' }}>
                <div style={{ fontSize: 9, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        {step === 'done' ? (

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 40 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0d2e26', border: '1px solid #10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✓</div>
            <p style={{ color: '#10a37f', fontSize: 14, fontWeight: 600, margin: 0 }}>Article queued for WF2</p>
            <p style={{ color: '#6b6b7b', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>
              {totalKeywords} keyword{totalKeywords !== 1 ? 's' : ''} confirmed
            </p>
          </div>

        ) : (

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Primary keyword ── */}
            <div>
              <div style={{ fontSize: 11, color: '#8e8ea0', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Primary keyword — always included
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#0d2e26', border: '1px solid #10a37f', borderRadius: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>✓</span>
                </div>
                <span style={{ fontSize: 13, color: '#10a37f', fontWeight: 600, flex: 1 }}>{keyword.keyword}</span>
                <span style={{ fontSize: 10, color: '#10a37f', fontFamily: 'monospace', background: '#0a2420', padding: '2px 6px', borderRadius: 4 }}>PRIMARY</span>
              </div>
            </div>

            {/* ── Scored related keywords from DB ── */}
            {relatedList.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#8e8ea0', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Scored keywords ({selected.size} selected)
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={selectAll}  style={{ fontSize: 11, color: '#10a37f', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', padding: 0 }}>Select all</button>
                    {selected.size > 0 && (
                      <button onClick={clearAll} style={{ fontSize: 11, color: '#6b6b7b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', padding: 0 }}>Clear</button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {relatedList.map((rk, i) => {
                    const isChecked = selected.has(rk.keyword)
                    const role      = roleColor(rk.usage_role)
                    const cc        = compColor(rk.competition)

                    return (
                      <div
                        key={i}
                        onClick={() => toggleRelated(rk.keyword)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px',
                          background: isChecked ? '#0d2e26' : '#262626',
                          border: `1px solid ${isChecked ? '#10a37f' : '#3a3a3a'}`,
                          borderRadius: 8, cursor: 'pointer',
                          transition: 'all .12s',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          background: isChecked ? '#10a37f' : 'transparent',
                          border: `1.5px solid ${isChecked ? '#10a37f' : '#4a4a4a'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .12s',
                        }}>
                          {isChecked && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
                        </div>

                        {/* Keyword + meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: isChecked ? '#ececec' : '#c4c4c4', fontWeight: isChecked ? 500 : 400, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rk.keyword}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: '#60a5fa', fontFamily: 'monospace' }}>
                              {rk.volume > 0 ? rk.volume.toLocaleString() + '/mo' : '—'}
                            </span>
                            <span style={{ fontSize: 10, color: cc, fontFamily: 'monospace' }}>{rk.competition}</span>
                            <span style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'monospace' }}>${rk.cpc}</span>
                            {rk.is_paa && (
                              <span style={{ fontSize: 9, color: '#a78bfa', background: '#1a1a2e', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>PAA</span>
                            )}
                            {rk.is_serp_related && (
                              <span style={{ fontSize: 9, color: '#60a5fa', background: '#0f1e2e', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>SERP</span>
                            )}
                          </div>
                        </div>

                        {/* Score + role badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: rk.score >= 65 ? '#10a37f' : rk.score >= 50 ? '#f59e0b' : '#8e8ea0', fontFamily: 'monospace' }}>
                            {rk.score}
                          </div>
                          <span style={{ fontSize: 9, color: role.color, background: role.bg, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {role.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Custom keyword input ── */}
            <div>
              <div style={{ fontSize: 11, color: '#8e8ea0', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Add custom keywords
              </div>

              {/* Input row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: customKws.length > 0 ? 10 : 0 }}>
                <input
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="Type a keyword and press Enter or Add"
                  style={{
                    flex: 1, padding: '9px 12px',
                    background: '#1e1e1e', border: '1px solid #3a3a3a',
                    borderRadius: 8, color: '#ececec', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e  => (e.target.style.borderColor = '#10a37f')}
                  onBlur={e   => (e.target.style.borderColor = '#3a3a3a')}
                />
                <button
                  onClick={addCustom}
                  disabled={!customInput.trim()}
                  style={{
                    padding: '9px 16px', background: customInput.trim() ? '#10a37f' : '#2a2a2a',
                    border: 'none', borderRadius: 8, color: customInput.trim() ? '#fff' : '#4a4a4a',
                    fontSize: 12, fontWeight: 600, cursor: customInput.trim() ? 'pointer' : 'default',
                    fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .15s',
                  }}
                >
                  + Add
                </button>
              </div>

              {/* Custom keyword chips */}
              {customKws.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {customKws.map((kw, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: 6 }}
                    >
                      <span style={{ fontSize: 12, color: '#4ade80' }}>{kw}</span>
                      <button
                        onClick={() => removeCustom(kw)}
                        style={{ background: 'none', border: 'none', color: '#4a4a4a', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 8, fontFamily: 'monospace' }}>
                ↵ Press Enter or click Add — these will be written into the article alongside selected keywords
              </div>
            </div>

          </div>
        )}

        {/* ── Footer ── */}
        {step !== 'done' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #3a3a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: '#6b6b7b', fontFamily: 'monospace' }}>
              {totalKeywords === 1
                ? 'Primary keyword only'
                : `${totalKeywords} keywords total (${allSelected.length} additional)`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  padding: '8px 20px',
                  background: loading ? '#0a2420' : '#10a37f',
                  border: 'none', borderRadius: 7, color: '#fff',
                  fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background .15s', opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />
                    Queueing...
                  </>
                ) : <>✦ Confirm & Queue Article</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Error bar ── */}
        {error && (
          <div style={{ padding: '10px 24px', background: '#2a1515', borderTop: '1px solid #5a2020', color: '#f87171', fontSize: 12, fontFamily: 'monospace', flexShrink: 0 }}>
            ⚠ {error}
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}