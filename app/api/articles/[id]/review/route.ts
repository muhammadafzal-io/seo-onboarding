import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const { data: article, error } = await sb
    .from('articles')
    .select(`
      id, client_id, keyword, keyword_normalized, slug,
      status, version, is_regeneration, content_angle,
      content, meta_title, meta_description,
      tags, focus_keyword, canonical_url,
      featured_image_url, image_prompt, image_source,
      target_word_count, target_audience, content_type, language,
      review_feedback, human_review_notes, reviewed_by, reviewed_at,
      revision_count, wp_post_id, wp_url, published_at,
      created_at, updated_at,
      clients!inner (
        id, name, domain, niche, tone, publish_platform, publish_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }
  const { data: keywords } = await sb
    .from('keywords')
    .select('id, keyword, is_primary, status, search_volumes, competition_label, cpc, opportunity_grade')
    .eq('article_id', id)
    .order('is_primary', { ascending: false })
  const wordCount = article.content
    ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    : 0


  const slug = article.slug || article.keyword
    ?.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()

  return NextResponse.json({
    ...article,
    slug,
    keywords: keywords || [],
    word_count: wordCount,
  })
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const body = await req.json()

  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const EDITABLE = [
    'content', 'meta_title', 'meta_description',
    'tags', 'slug', 'focus_keyword', 'canonical_url',
    'featured_image_url', 'human_review_notes',
  ]

  const update: Record<string, any> = {}
  EDITABLE.forEach(f => { if (body[f] !== undefined) update[f] = body[f] })

  const VALID_STATUS = ['human_review', 'need_revision', 'approved']
  if (body.status && VALID_STATUS.includes(body.status)) {
    update.status = body.status
    if (body.status === 'approved' || body.status === 'need_revision') {
      update.reviewed_at = new Date().toISOString()
      if (body.reviewer) update.reviewed_by = body.reviewer
    }
    if (body.status === 'need_revision') {
      update.revision_count = sb.rpc // handled below
    }
  }

  if (body.status === 'need_revision') {
    await sb.rpc('increment_revision_count', { p_article_id: id })
      .then(({ error }) => { if (error) console.warn('[review patch] revision increment:', error.message) })
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await sb
    .from('articles')
    .update(update)
    .eq('id', id)
    .select('id, status, updated_at, meta_title, reviewed_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.status === 'approved' && process.env.WF4_WEBHOOK_URL) {
    fetch(process.env.WF2_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: id, triggered_by: 'human_approval' }),
    }).catch(e => console.warn('[review] WF4 webhook non-fatal:', e))
  }

  // Log
  await sb.from('agent_logs').insert({
    article_id: id,
    agent_name: 'human_review',
    action: `article_${body.status || 'edited'}`,
    status: 'ok',
    details: JSON.stringify({ fields_updated: Object.keys(update), new_status: body.status }),
  })

  return NextResponse.json({ success: true, ...data })
}