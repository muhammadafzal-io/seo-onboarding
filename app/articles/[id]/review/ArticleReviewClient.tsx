'use client'
import { useState, useCallback } from 'react'
import Layout from '../../../../components/Layout'

type ReviewData = {
  article: any
  client: any
  keywords: any[]
  wordCount: number
  versions: any[]
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  written: { bg: '#1a1a2e', color: '#a78bfa' },
  human_review: { bg: '#2a1a10', color: '#fb923c' },
  need_revision: { bg: '#2a1515', color: '#f87171' },
  approved: { bg: '#1a2e1a', color: '#4ade80' },
  published: { bg: '#0d2e26', color: '#10a37f' },
}

function Badge({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status] || { bg: '#2a2a2a', color: '#8e8ea0' }
  return (
    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function MetricPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: '#262626', border: '1px solid #3a3a3a', borderRadius: 7, padding: '6px 12px', display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 9, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || '#ececec', fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}


function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim().toLowerCase()
    if (v && !tags.includes(v)) { onChange([...tags, v]); setInput('') }
  }
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#1e2a1e', border: '1px solid #2a4a2a', borderRadius: 6, fontSize: 12, color: '#4ade80' }}>
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', color: '#4a6a4a', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}>✕</button>
          </span>
        ))}
        {tags.length === 0 && <span style={{ fontSize: 12, color: '#4a4a4a', fontStyle: 'italic' }}>No tags yet</span>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add tag and press Enter"
          style={{ flex: 1, background: '#262626', border: '1px solid #3a3a3a', borderRadius: 7, padding: '7px 10px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
          onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
        />
        <button onClick={add} style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer' }}>+</button>
      </div>
    </div>
  )
}

function Section({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #2a2a2a' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ececec', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{icon}</span>{title}
        </span>
        {action}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{children}</label>
}

function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, padding: '8px 12px', color: '#ececec', fontSize: mono ? 12 : 13, outline: 'none', fontFamily: mono ? 'monospace' : 'inherit', boxSizing: 'border-box' }}
      onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
      onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
    />
  )
}

function TextArea({ value, onChange, rows = 3, placeholder, mono }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; mono?: boolean }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, padding: '8px 12px', color: '#ececec', fontSize: mono ? 12 : 13, outline: 'none', fontFamily: mono ? 'monospace' : 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
      onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
      onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
    />
  )
}


export default function ArticleReviewClient({ data }: { data: ReviewData }) {
  const { article, client, keywords, wordCount, versions } = data


  const [metaTitle, setMetaTitle] = useState(article.meta_title || '')
  const [metaDesc, setMetaDesc] = useState(article.meta_description || '')
  const [slug, setSlug] = useState(article.slug || '')
  const [focusKeyword, setFocusKeyword] = useState(article.focus_keyword || keywords.find((k: any) => k.is_primary)?.keyword || '')
  const [canonical, setCanonical] = useState(article.canonical_url || '')
  const [tags, setTags] = useState<string[]>(Array.isArray(article.tags) ? article.tags : [])
  const [reviewNotes, setReviewNotes] = useState(article.human_review_notes || '')
  const [imageUrl, setImageUrl] = useState(article.featured_image_url || '')
  const [content, setContent] = useState(article.content || '')
  const [previewMode, setPreviewMode] = useState(false)

  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<'approve' | 'revise' | 'save' | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [currentStatus, setCurrentStatus] = useState(article.status)

  const handleMetaTitleChange = (v: string) => {
    setMetaTitle(v)
    if (!article.slug) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim())
    }
  }


  const metaTitleLen = metaTitle.length
  const metaDescLen = metaDesc.length
  const titleColor = metaTitleLen > 60 ? '#f87171' : metaTitleLen < 40 ? '#f59e0b' : '#10a37f'
  const descColor = metaDescLen > 160 ? '#f87171' : metaDescLen < 120 ? '#f59e0b' : '#10a37f'


  const patch = useCallback(async (body: Record<string, any>) => {
    const res = await fetch(`/api/articles/${article.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed')
    return json
  }, [article.id])



  const handleSave = async () => {
    setActionLoading('save'); setError('')
    try {
      await patch({
        content,
        meta_title: metaTitle,
        meta_description: metaDesc,
        slug,
        focus_keyword: focusKeyword,
        canonical_url: canonical,
        tags,
        human_review_notes: reviewNotes,
        featured_image_url: imageUrl,
        status: 'human_review'
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(null) }
  }

  const handleApprove = async () => {
    setActionLoading('approve'); setError('')
    try {
      await patch({
        content,
        meta_title: metaTitle,
        meta_description: metaDesc,
        slug,
        tags,
        status: 'approved'
      })
      setCurrentStatus('approved')
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(null) }
  }

  const handleRevise = async () => {
    if (!reviewNotes.trim()) { setError('Please add notes in "Reviewer notes" field first'); return }
    setActionLoading('revise'); setError('')
    try {
      await patch({
        human_review_notes: reviewNotes,
        status: 'need_revision'
      })
      setCurrentStatus('need_revision')
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(null) }
  }

  const isApproved = currentStatus === 'approved'
  const isPublished = currentStatus === 'published'

  // ── Style helpers ─────────────────────────────────────────
  const td: React.CSSProperties = { padding: '9px 12px', borderBottom: '1px solid #2a2a2a', fontSize: 13, color: '#8e8ea0', verticalAlign: 'middle' }
  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', fontWeight: 500, borderBottom: '1px solid #3f3f3f' }

  return (
    <Layout title="Article Review">
      <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: '0px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>


          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 12, color: '#6b6b7b' }}>
            <a href="/dashboard" style={{ color: '#6b6b7b', textDecoration: 'none' }}>Dashboard</a>
            <span>›</span>
            <a href="/clients" style={{ color: '#6b6b7b', textDecoration: 'none' }}>Clients</a>
            <span>›</span>
            <a href={`/client/${client?.id}`} style={{ color: '#6b6b7b', textDecoration: 'none' }}>{client?.name || client?.domain}</a>
            <span>›</span>
            <a href={`/articles?clientId=${client?.id}`} style={{ color: '#6b6b7b', textDecoration: 'none' }}>Articles</a>
            <span>›</span>
            <span style={{ color: '#ececec' }}>Review</span>
          </div>


          <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 14, padding: 24, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge status={currentStatus} />
                {article.version > 1 && (
                  <span style={{ fontSize: 10, color: '#8e8ea0', fontFamily: 'monospace', background: '#2a2a2a', padding: '2px 8px', borderRadius: 4 }}>
                    v{article.version}
                    {article.content_angle && ` · ${article.content_angle}`}
                  </span>
                )}
                {isPublished && article.wp_url && (
                  <a href={article.wp_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace' }}>
                    ↗  View live
                  </a>
                )}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: '#ececec', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {article.keyword}
              </h1>
              <p style={{ fontSize: 13, color: '#6b6b7b', fontFamily: 'monospace' }}>
                {client?.name} · {client?.domain}
              </p>
            </div>


            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              <MetricPill label="Words" value={wordCount.toLocaleString()} color="#60a5fa" />
              <MetricPill label="Keywords" value={keywords.length} />
              <MetricPill label="Revision" value={`${article.revision_count}/3`} color={article.revision_count >= 2 ? '#f87171' : '#8e8ea0'} />
              {keywords[0]?.search_volumes > 0 && (
                <MetricPill label="Volume" value={keywords[0].search_volumes.toLocaleString()} color="#10a37f" />
              )}
              {keywords[0]?.opportunity_grade && (
                <MetricPill label="Grade" value={keywords[0].opportunity_grade} color="#10a37f" />
              )}
            </div>
          </div>


          {!isPublished && (
            <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setPreviewMode(!previewMode)}
                  style={{ padding: '7px 16px', background: previewMode ? '#2a2a2a' : 'transparent', border: '1px solid #3a3a3a', borderRadius: 7, color: previewMode ? '#ececec' : '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {previewMode ? '✎ Edit' : '◻ Preview'}
                </button>
                <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>
                  {saved ? '✓ Saved' : 'Unsaved changes'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {error && <span style={{ fontSize: 12, color: '#f87171', fontFamily: 'monospace' }}>⚠ {error}</span>}
                <button onClick={handleSave} disabled={actionLoading === 'save'}
                  style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {actionLoading === 'save' ? 'Saving…' : 'Save draft'}
                </button>
                <button onClick={handleRevise} disabled={!!actionLoading || isApproved}
                  style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #5a2020', borderRadius: 7, color: '#f87171', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: isApproved ? 0.4 : 1 }}>
                  {actionLoading === 'revise' ? 'Sending…' : '↩ Need revision'}
                </button>
                <button onClick={handleApprove} disabled={!!actionLoading || isApproved}
                  style={{ padding: '7px 20px', background: isApproved ? '#0a2420' : '#10a37f', border: 'none', borderRadius: 7, color: isApproved ? '#10a37f' : '#fff', fontSize: 13, fontWeight: 600, cursor: isApproved ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
                  {actionLoading === 'approve' ? (
                    <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Approving…</>
                  ) : isApproved ? '✓ Approved' : '✦ Approve & publish'}
                </button>
              </div>
            </div>
          )}


          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>


            <div>
              {previewMode ? (

                <Section title="Article preview" icon="◻">
                  <div style={{ marginBottom: 16, padding: '12px 16px', background: '#262626', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', marginBottom: 4 }}>TITLE TAG ({metaTitleLen} chars)</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#10a37f', marginBottom: 2 }}>{metaTitle || '—'}</div>
                    <div style={{ fontSize: 12, color: '#8e8ea0', fontFamily: 'monospace' }}>{client?.domain}/{slug}</div>
                    <div style={{ fontSize: 13, color: '#a0a0a0', marginTop: 4 }}>{metaDesc || '—'}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b6b7b', fontFamily: 'monospace', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article content</div>
                  <div
                    style={{ color: '#d1d1d1', lineHeight: 1.8, fontSize: 14 }}
                    dangerouslySetInnerHTML={{ __html: content || '<p style="color:#4a4a4a">No content yet</p>' }}
                  />
                </Section>
              ) : (

                <Section title="Article content" icon="✎"
                  action={<span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{wordCount.toLocaleString()} words</span>}>
                  <div style={{ marginBottom: 6, display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace' }}>
                      HTML editor · paste or type directly
                    </span>
                    {article.revision_count > 0 && article.review_feedback && (
                      <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'monospace' }}>
                        WF3 feedback: {article.review_feedback}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={32}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 8, padding: '12px', color: '#d1d1d1', fontSize: 13, outline: 'none', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
                  />
                </Section>
              )}
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>


              <Section title="SEO meta" icon="◈">
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel>
                    Meta title
                    <span style={{ marginLeft: 8, color: titleColor, fontSize: 10 }}>{metaTitleLen}/60</span>
                  </FieldLabel>
                  <TextInput value={metaTitle} onChange={handleMetaTitleChange} placeholder="Enter compelling meta title…" />
                  {metaTitleLen > 60 && <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Too long — Google truncates at ~60 chars</p>}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel>
                    Meta description
                    <span style={{ marginLeft: 8, color: descColor, fontSize: 10 }}>{metaDescLen}/160</span>
                  </FieldLabel>
                  <TextArea value={metaDesc} onChange={setMetaDesc} rows={3} placeholder="Describe the article to entice clicks…" />
                  {metaDescLen > 160 && <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Too long — will be truncated in SERPs</p>}
                </div>


                <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: '#4a4a4a', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>SERP preview</div>
                  <div style={{ fontSize: 14, color: '#60a5fa', fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {metaTitle || 'Meta title…'}
                  </div>
                  <div style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace', marginBottom: 4 }}>
                    {client?.domain}/{slug || 'url-slug'}
                  </div>
                  <div style={{ fontSize: 13, color: '#8e8ea0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {metaDesc || 'Meta description will appear here…'}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <FieldLabel>URL slug</FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, overflow: 'hidden' }}>
                    <span style={{ padding: '8px 10px', fontSize: 12, color: '#4a4a4a', fontFamily: 'monospace', borderRight: '1px solid #3a3a3a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      /{client?.domain?.split('.')[0] || 'blog'}/
                    </span>
                    <input value={slug} onChange={e => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                      style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 10px', color: '#ececec', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <FieldLabel>Focus keyword</FieldLabel>
                  <TextInput value={focusKeyword} onChange={setFocusKeyword} placeholder="Primary SEO keyword" mono />
                </div>

                <div>
                  <FieldLabel>Canonical URL <span style={{ color: '#4a4a4a', fontWeight: 400 }}>(optional)</span></FieldLabel>
                  <TextInput value={canonical} onChange={setCanonical} placeholder="https://…" mono />
                </div>
              </Section>


              <Section title="Tags" icon="◇">
                <TagInput tags={tags} onChange={setTags} />
              </Section>


              <Section title="Featured image" icon="◻">
                {imageUrl ? (
                  <div style={{ marginBottom: 12 }}>
                    <img src={imageUrl} alt="Featured" style={{ width: '100%', borderRadius: 8, border: '1px solid #3a3a3a', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => setImageUrl('')} style={{ marginTop: 6, fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace' }}>
                      ✕ Remove image
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: 12, padding: '24px', border: '2px dashed #3a3a3a', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace', marginBottom: 6 }}>No image uploaded</div>
                    <div style={{ fontSize: 11, color: '#4a4a4a' }}>Paste URL below</div>
                  </div>
                )}
                <FieldLabel>Image URL</FieldLabel>
                <TextInput value={imageUrl} onChange={setImageUrl} placeholder="https://…" mono />
                {article.image_prompt && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace', cursor: 'pointer' }}>AI image prompt ▸</summary>
                    <p style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', marginTop: 6, lineHeight: 1.5, padding: 8, background: '#1a1a1a', borderRadius: 6 }}>
                      {article.image_prompt}
                    </p>
                  </details>
                )}
              </Section>


              <Section title="Keywords" icon="⌕">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Keyword</th>
                      <th style={{ ...th, textAlign: 'right' }}>Vol</th>
                      <th style={{ ...th, textAlign: 'center' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((kw: any) => (
                      <tr key={kw.id}>
                        <td style={{ ...td, color: kw.is_primary ? '#10a37f' : '#d1d1d1', fontWeight: kw.is_primary ? 600 : 400, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {kw.is_primary && <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#10a37f', marginRight: 4 }}>PRIMARY</span>}
                          {kw.keyword}
                        </td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                          {kw.search_volumes > 0 ? kw.search_volumes.toLocaleString() : '—'}
                        </td>
                        <td style={{ ...td, textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: kw.opportunity_grade?.startsWith('A') ? '#10a37f' : '#8e8ea0' }}>
                          {kw.opportunity_grade || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="Reviewer notes" icon="✎">
                <TextArea value={reviewNotes} onChange={setReviewNotes} rows={4}
                  placeholder="Add feedback or revision instructions for WF2…" />
                {article.review_feedback && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#2a1515', border: '1px solid #5a2020', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: '#f87171', fontFamily: 'monospace', marginBottom: 3 }}>WF3 FEEDBACK</div>
                    <div style={{ fontSize: 12, color: '#f87171' }}>{article.review_feedback}</div>
                  </div>
                )}
              </Section>

              {versions.length > 1 && (
                <Section title="Version history" icon="◷">
                  {versions.map((v: any) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #2a2a2a' }}>
                      <div>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#8e8ea0' }}>v{v.version}</span>
                        {v.content_angle && <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace', marginLeft: 6 }}>{v.content_angle}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Badge status={v.status} />
                        {v.id !== article.id && (
                          <a href={`/articles/${v.id}/review`} style={{ fontSize: 11, color: '#10a37f', fontFamily: 'monospace', textDecoration: 'none' }}>View →</a>
                        )}
                      </div>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          </div>


          {!isPublished && (
            <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 10, padding: '14px 20px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#4a4a4a', fontFamily: 'monospace', marginRight: 'auto' }}>
                {isApproved ? '✓ Article approved — WF4 will publish next run' : 'Review content, update SEO fields, then approve'}
              </span>
              <button onClick={handleSave} disabled={actionLoading === 'save'}
                style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Save draft
              </button>
              <button onClick={handleRevise} disabled={!!actionLoading || isApproved}
                style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #5a2020', borderRadius: 7, color: '#f87171', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ↩ Need revision
              </button>
              <button onClick={handleApprove} disabled={!!actionLoading || isApproved}
                style={{ padding: '8px 22px', background: isApproved ? '#0a2420' : '#10a37f', border: 'none', borderRadius: 7, color: isApproved ? '#10a37f' : '#fff', fontSize: 13, fontWeight: 600, cursor: isApproved ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {isApproved ? '✓ Approved' : '✦ Approve & publish'}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:1024px){.review-grid{grid-template-columns:1fr!important}}`}</style>
    </Layout>
  )
}