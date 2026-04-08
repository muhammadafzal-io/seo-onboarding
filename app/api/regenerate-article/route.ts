// app/api/regenerate-article/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const REGENERATABLE = ['published', 'written', 'approved', 'failed', 'need_revision']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { article_id, reason = 'manual_regeneration' } = body

    if (!article_id) {
      return NextResponse.json({ error: 'article_id is required' }, { status: 400 })
    }

    // ── 1. Fetch original article ──────────────
    const { data: original, error: fetchErr } = await sb
      .from('articles')
      .select(`
        id, client_id, keyword, keyword_normalized,
        status, generation, parent_article_id,
        target_word_count, target_audience, content_type, language,
        image_prompt, meta_title, meta_description
      `)
      .eq('id', article_id)
      .single()

    if (fetchErr || !original) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (!REGENERATABLE.includes(original.status)) {
      return NextResponse.json({
        error: `Article status "${original.status}" cannot be regenerated.`,
      }, { status: 400 })
    }

    // ── 2. Determine identifiers ────────────
    const rootId = original.parent_article_id ?? original.id
    const nextGeneration = (original.generation ?? 1) + 1
    const variationSeed = Math.floor(Math.random() * 9000) + 1000

    // ── 3. Create NEW article row via UPSERT ────────────
    // Using upsert with the correct onConflict prevents the unique constraint error
    const { data: newArticle, error: createErr } = await sb
      .from('articles')
      .upsert({
        client_id:          original.client_id,
        keyword:            original.keyword,
        keyword_normalized: original.keyword_normalized,
        status:             'new',
        generation:         nextGeneration,
        parent_article_id:  rootId,
        regenerate_reason:  reason,
        regenerated_at:     new Date().toISOString(),
        target_word_count:  original.target_word_count  || 1500,
        target_audience:    original.target_audience    || 'general audience',
        content_type:       original.content_type       || 'blog_post',
        language:           original.language           || 'en',
        content:            null,
        meta_title:         null,
        meta_description:   null,
        featured_image_url: null,
        image_prompt:       original.image_prompt || null,
        attempts:           0,
      }, {
        // This matches the SQL constraint we created in Part 1
       onConflict: 'client_id,keyword_normalized,generation' // No spaces
      })
      .select()
      .single()

    if (createErr || !newArticle) {
      return NextResponse.json({ error: createErr?.message || 'Failed to create regenerated article' }, { status: 500 })
    }

    // ── 4. Clone keywords ─────────────
    const { data: originalKeywords } = await sb
      .from('keywords')
      .select('*')
      .eq('article_id', article_id)

    if (originalKeywords && originalKeywords.length > 0) {
      const kwInserts = originalKeywords.map((kw: any) => ({
        article_id:                 newArticle.id,
        client_id:                  original.client_id,
        keyword:                    kw.keyword,
        keyword_normalized:         kw.keyword_normalized,
        is_primary:                 kw.is_primary,
        status:                     'researched',
        search_volumes:             kw.search_volumes,
        competition:                kw.competition,
        cpc:                        kw.cpc,
        related_keywords:           kw.related_keywords,
        selected_related_keywords:  kw.selected_related_keywords,
        all_selected_keywords:      kw.all_selected_keywords,
        queued_at:                  new Date().toISOString(),
      }))

      // Use upsert here too to prevent errors on double-clicking
      await sb.from('keywords').upsert(kwInserts, { onConflict: 'article_id, keyword_normalized' })
    }

    // ── 5. Fetch client and trigger WF2 ─────────────────
    const { data: client } = await sb
      .from('clients')
      .select('*')
      .eq('id', original.client_id)
      .single()

    const wf2Url = process.env.WF2_WEBHOOK_URL
    let webhookFired = false

    if (wf2Url) {
      try {
        const r = await fetch(wf2Url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            article_id:         newArticle.id,
            parent_article_id:  rootId,
            client_id:          original.client_id,
            generation:         nextGeneration,
            primary_keyword:    original.keyword,
            is_regeneration:    true,
            variation_seed:     variationSeed,
            client_name:        client?.name || '',
            client_domain:      client?.domain || '',
            client_tone:        client?.tone || 'Professional',
            triggered_by:       'regeneration',
          }),
        })
        webhookFired = r.ok
      } catch (e) {
        console.error('Webhook failed', e)
      }
    }

    // ── 6. Log event ──────────────────────────────────
    await sb.from('agent_logs').insert({
      client_id:  original.client_id,
      article_id: newArticle.id,
      agent_name: 'human_approval',
      action:     'article_regeneration_triggered',
      status:     'ok',
      details:    JSON.stringify({ reason, variation_seed: variationSeed }),
    })

    return NextResponse.json({
      success: true,
      new_article_id: newArticle.id,
      generation: nextGeneration,
      message: `Generation ${nextGeneration} queued with seed ${variationSeed}.`,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}