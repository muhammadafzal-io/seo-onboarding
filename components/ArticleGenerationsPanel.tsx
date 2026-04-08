'use client'
// components/ArticleGenerationsPanel.tsx
// Shows all versions (generations) of an article in a timeline
// Drop this into any article detail page

import { useState, useEffect } from 'react'

type Generation = {
  id:                 number
  status:             string
  generation:         number
  meta_title:         string | null
  featured_image_url: string | null
  regenerate_reason:  string | null
  regenerated_at:     string | null
  created_at:         string
  updated_at:         string
  wp_url:             string | null
}

type Props = {
  rootArticleId:    number   // the original article id (generation=1) or any sibling
  currentArticleId: number
  keyword:          string
  onSelectVersion?: (articleId: number) => void
}

const STATUS_COLOR: Record<string, string> = {
  published: '#10a37f', written: '#a78bfa', approved: '#4ade80',
  processing: '#f59e0b', failed: '#f87171', need_revision: '#d946ef', new: '#60a5fa',
}

const REASON_LABEL: Record<string, string> = {
  manual_regeneration: 'Fresh variation',
  quality_issue:       'Quality issue',
  client_request:      'Client request',
  outdated_content:    'Outdated content',
  test:                'Test run',
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ArticleGenerationsPanel({ rootArticleId, currentArticleId, keyword, onSelectVersion }: Props) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res  = await fetch(`/api/article-generations?root_id=${rootArticleId}&keyword=${encodeURIComponent(keyword)}`)
        const data = await res.json()
        setGenerations(data.generations || [])
      } catch (e) {
        console.error('[GenerationsPanel] fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [rootArticleId, keyword])

  if (loading) {
    return (
      <div style={{ padding: '16px 0', textAlign: 'center' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #3a3a3a', borderTopColor: '#10a37f', animation: 'gpspin .7s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes gpspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (generations.length === 0) return null

  return (
    <div style={{ background: '#262626', border: '1px solid #3a3a3a', borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #3a3a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ececec' }}>Version History</span>
          <span style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', background: '#2a2a2a', padding: '2px 7px', borderRadius: 4 }}>
            {generations.length} generation{generations.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{keyword}</span>
      </div>

      {/* Timeline */}
      <div style={{ padding: '8px 0' }}>
        {generations.map((g, i) => {
          const isCurrent = g.id === currentArticleId
          const sc        = STATUS_COLOR[g.status] || '#8e8ea0'
          const isLatest  = i === 0

          return (
            <div key={g.id}
              onClick={() => onSelectVersion?.(g.id)}
              style={{ display: 'flex', gap: 12, padding: '10px 16px', cursor: onSelectVersion ? 'pointer' : 'default', background: isCurrent ? '#0d1f1a' : 'transparent', transition: 'background .12s', borderLeft: `3px solid ${isCurrent ? '#10a37f' : 'transparent'}` }}
              onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#2a2a2a' }}
              onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Generation badge */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isCurrent ? '#0d2e26' : '#2a2a2a', border: `1.5px solid ${isCurrent ? '#10a37f' : '#3a3a3a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isCurrent ? '#10a37f' : '#6b6b7b', fontFamily: 'monospace' }}>
                  v{g.generation}
                </div>
                {i < generations.length - 1 && (
                  <div style={{ width: 1, height: 20, background: '#3a3a3a', marginTop: 2 }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: isCurrent ? '#ececec' : '#8e8ea0', fontWeight: isCurrent ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                    {g.meta_title || `Generation ${g.generation}`}
                  </span>
                  {isLatest && !isCurrent && (
                    <span style={{ fontSize: 9, color: '#10a37f', background: '#0d2e26', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>LATEST</span>
                  )}
                  {isCurrent && (
                    <span style={{ fontSize: 9, color: '#f59e0b', background: '#2a1f0a', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>VIEWING</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Status */}
                  <span style={{ fontSize: 10, color: sc, fontFamily: 'monospace' }}>⬤ {g.status}</span>
                  {/* Time */}
                  <span style={{ fontSize: 10, color: '#4a4a4a', fontFamily: 'monospace' }}>{timeAgo(g.created_at)}</span>
                  {/* Reason (for regenerations) */}
                  {g.regenerate_reason && g.generation > 1 && (
                    <span style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', background: '#2a2a2a', padding: '1px 6px', borderRadius: 3 }}>
                      {REASON_LABEL[g.regenerate_reason] || g.regenerate_reason}
                    </span>
                  )}
                  {/* Wp link */}
                  {g.wp_url && (
                    <a href={g.wp_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, color: '#10a37f', textDecoration: 'none', fontFamily: 'monospace' }}
                      onClick={e => e.stopPropagation()}>
                      ↗ live
                    </a>
                  )}
                </div>
              </div>

              {/* Thumbnail */}
              {g.featured_image_url && (
                <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#2a2a2a' }}>
                  <img src={g.featured_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          ) 
        })}
      </div>
    </div>
  )
}

