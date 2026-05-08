import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function normalizeKeyword(input: string): string {
  return input.trim().toLowerCase()
}

function parseRelatedKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map(v => String(v || '').trim())
          .filter(Boolean)
          .map(normalizeKeyword)
      )
    )
  }

  if (typeof input === 'string') {
    return Array.from(
      new Set(
        input
          .split(/[\n,]+/)
          .map(v => v.trim())
          .filter(Boolean)
          .map(normalizeKeyword)
      )
    )
  }

  return []
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number(params.id)
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client id' }, { status: 400 })
    }

    const body = await req.json()
    const primaryKeywordRaw = String(body.primary_keyword || '').trim()
    const primaryKeyword = normalizeKeyword(primaryKeywordRaw)
    const relatedKeywords = parseRelatedKeywords(body.related_keywords)
    const contextBrief = String(body.context_brief || '').trim()
    const nicheOverride = String(body.niche_override || '').trim()
    const targetAudience = String(body.target_audience || '').trim() || 'general audience'
    const contentType = String(body.content_type || '').trim() || 'blog_post'
    const language = String(body.language || '').trim() || 'en'
    const tone = String(body.tone || '').trim()
    const parsedWordCount = Number(body.target_word_count)
    const targetWordCount = Number.isFinite(parsedWordCount) && parsedWordCount > 0 ? parsedWordCount : 1500

    if (!primaryKeyword) {
      return NextResponse.json({ error: 'primary_keyword is required' }, { status: 400 })
    }

    const { data: client, error: clientErr } = await sb
      .from('clients')
      .select('id, name, domain, niche, tone, notes')
      .eq('id', clientId)
      .single()

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: latestSameKeyword } = await sb
      .from('articles')
      .select('id, generation, parent_article_id')
      .eq('client_id', clientId)
      .eq('keyword_normalized', primaryKeyword)
      .order('generation', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextGeneration = (latestSameKeyword?.generation || 0) + 1
    const rootParentId = latestSameKeyword
      ? latestSameKeyword.parent_article_id || latestSameKeyword.id
      : null

    const allKeywords = Array.from(new Set([primaryKeyword, ...relatedKeywords]))
    const effectiveNiche = nicheOverride || client.niche || ''
    const effectiveTone = tone || client.tone || 'professional'
    const imagePrompt =
      `Professional blog header image representing: ${allKeywords.join(', ')}. ` +
      `Industry: ${effectiveNiche || 'general'}. Tone: ${effectiveTone}. ` +
      `Clean modern photography style, high quality, absolutely no text or words in the image.`

    const { data: newArticle, error: articleErr } = await sb
      .from('articles')
      .insert({
        client_id: clientId,
        keyword: primaryKeyword,
        keyword_normalized: primaryKeyword,
        status: 'scouted',
        generation: nextGeneration,
        parent_article_id: rootParentId,
        target_word_count: targetWordCount,
        target_audience: targetAudience,
        content_type: contentType,
        language,
        content_angle: effectiveNiche || null,
        human_review_notes: contextBrief || client.notes || null,
        image_prompt: imagePrompt,
        priority: 0,
      })
      .select('id, client_id, keyword, generation, status')
      .single()

    if (articleErr || !newArticle) {
      return NextResponse.json({ error: articleErr?.message || 'Failed to create article' }, { status: 500 })
    }

    const keywordRows = allKeywords.map((kw, index) => ({
      article_id: newArticle.id,
      client_id: clientId,
      keyword: kw,
      keyword_normalized: kw,
      is_primary: index === 0,
      status: 'scouted',
      related_keywords: index === 0 ? relatedKeywords : null,
    }))

    const { error: kwErr } = await sb
      .from('keywords')
      .upsert(keywordRows, { onConflict: 'article_id,keyword_normalized' })

    if (kwErr) {
      return NextResponse.json({ error: kwErr.message }, { status: 500 })
    }

    await sb.from('agent_logs').insert({
      client_id: clientId,
      article_id: newArticle.id,
      agent_name: 'dashboard',
      action: 'new_article_created_for_client',
      status: 'ok',
      details: JSON.stringify({
        primary_keyword: primaryKeyword,
        related_keywords: relatedKeywords,
        content_type: contentType,
        target_word_count: targetWordCount,
        target_audience: targetAudience,
        language,
        tone: effectiveTone,
        content_angle: effectiveNiche || null,
      }),
    })

    return NextResponse.json({
      success: true,
      article: newArticle,
      keywords_count: keywordRows.length,
      message: 'New article generation request created successfully.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

