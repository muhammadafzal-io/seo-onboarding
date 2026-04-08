'use client'
// components/RegenerateButton.tsx
// Drop this anywhere an article row appears — articles list, article detail, client profile
// Shows: Regenerate button → reason modal → confirmation → fires API → updates UI

import { useState } from 'react'

type Props = {
  articleId:   number
  keyword:     string
  status:      string
  generation?: number
  onSuccess?:  (newArticleId: number) => void
}

const REASONS = [
  { value: 'manual_regeneration', label: 'Generate fresh variation' },
  { value: 'quality_issue',       label: 'Quality not acceptable'   },
  { value: 'client_request',      label: 'Client requested changes' },
  { value: 'outdated_content',    label: 'Content is outdated'      },
  { value: 'test',                label: 'Testing / dev'            },
]

// Statuses that allow regeneration
const CAN_REGENERATE = ['published', 'written', 'approved', 'failed', 'need_revision']

export default function RegenerateButton({ articleId, keyword, status, generation = 1, onSuccess }: Props) {
  const [open,    setOpen]    = useState(false)
  const [reason,  setReason]  = useState('manual_regeneration')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  if (!CAN_REGENERATE.includes(status)) return null

  const handleRegenerate = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/regenerate-article', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ article_id: articleId, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); onSuccess?.(data.new_article_id) }, 1800)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title={`Regenerate article (currently gen ${generation})`}
        style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 6, color: '#8e8ea0', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#10a37f'; e.currentTarget.style.color = '#10a37f' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#8e8ea0' }}
      >
        ↺ Regenerate.......
        {generation > 1 && <span style={{ fontSize: 9, background: '#2a2a2a', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>v{generation}</span>}
      </button>

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 14, width: '100%', maxWidth: 420, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #3a3a3a' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Regenerate Article</p>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#ececec', margin: 0, letterSpacing: '-0.02em' }}>New version of this article</h2>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#6b6b7b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>✕</button>
              </div>

              {/* Keyword pill */}
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#262626', border: '1px solid #3a3a3a', borderRadius: 6, padding: '5px 10px' }}>
                <span style={{ fontSize: 9, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase' }}>Keyword</span>
                <span style={{ fontSize: 12, color: '#10a37f', fontWeight: 600, fontFamily: 'monospace' }}>{keyword}</span>
                <span style={{ fontSize: 9, color: '#4a4a4a', fontFamily: 'monospace' }}>gen {generation} → gen {generation + 1}</span>
              </div>
            </div>

            {/* Body */}
            {done ? (
              <div style={{ padding: '32px 22px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0d2e26', border: '1px solid #10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 12px' }}>✓</div>
                <p style={{ color: '#10a37f', fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Generation {generation + 1} queued</p>
                <p style={{ color: '#6b6b7b', fontSize: 12, fontFamily: 'monospace', margin: 0 }}>WF2 will write new content + image</p>
              </div>
            ) : (
              <div style={{ padding: '18px 22px' }}>
                {/* Info box */}
                <div style={{ background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#8e8ea0', lineHeight: 1.7 }}>
                  This will create a <strong style={{ color: '#ececec' }}>new article (generation {generation + 1})</strong> using the same keyword and SEO data. WF2 will write <strong style={{ color: '#ececec' }}>completely fresh content</strong> and generate a <strong style={{ color: '#ececec' }}>new AI image</strong>. The original article is preserved.
                </div>

                {/* Reason selector */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Reason for regeneration</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {REASONS.map(r => (
                      <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: reason === r.value ? '#0d2e26' : '#262626', border: `1px solid ${reason === r.value ? '#10a37f' : '#3a3a3a'}`, borderRadius: 7, cursor: 'pointer', transition: 'all .1s' }}>
                        <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} style={{ accentColor: '#10a37f', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: reason === r.value ? '#ececec' : '#8e8ea0', fontWeight: reason === r.value ? 500 : 400 }}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            {!done && (
              <>
                {error && <div style={{ padding: '8px 22px', background: '#2a1515', borderTop: '1px solid #5a2020', color: '#f87171', fontSize: 12, fontFamily: 'monospace' }}>⚠ {error}</div>}
                <div style={{ padding: '14px 22px', borderTop: '1px solid #3a3a3a', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setOpen(false)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={handleRegenerate} disabled={loading}
                    style={{ padding: '8px 18px', background: loading ? '#0a2420' : '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
                    {loading
                      ? <><div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'rgspin .7s linear infinite' }} />Queuing...</>
                      : <>↺ Regenerate Article</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes rgspin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}