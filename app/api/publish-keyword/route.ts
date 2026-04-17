// app/api/publish-keyword/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const CONTENT_ANGLES = [
  'comprehensive guide',
  'practical tips',
  'beginner friendly',
  'expert deep dive',
  'comparison and review',
  'step by step tutorial',
  'myths vs facts',
  'case study approach',
  'pros and cons analysis',
  'future trends overview',
]

const WRITING_STYLES = [
  'conversational and friendly',
  'authoritative and expert',
  'storytelling with examples',
  'data-driven and analytical',
  'question and answer format',
  'listicle with explanations',
  'journalistic and objective',
]

const IMAGE_STYLES = [
  'clean flat design illustration',
  'modern photography with bokeh',
  'minimalist vector art',
  'vibrant infographic style',
  'dark moody professional photo',
  'bright airy lifestyle photo',
  'technical diagram style',
  'abstract geometric shapes',
]

const IMAGE_MOODS = [
  'professional and trustworthy',
  'energetic and inspiring',
  'calm and reassuring',
  'bold and striking',
  'warm and inviting',
  'clean and modern',
]

const INTRO_HOOKS = [
  'start with a surprising statistic',
  'start with a compelling question',
  'start with a relatable scenario',
  'start with a bold claim',
  'start with a brief story',
  'start with a common misconception',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildVariationSeed() {
  return Math.floor(Math.random() * 900000) + 100000
}

function buildContentVariation() {
  return {
    variation_seed: buildVariationSeed(),
    content_angle: pick(CONTENT_ANGLES),
    writing_style: pick(WRITING_STYLES),
    intro_hook: pick(INTRO_HOOKS),
    image_style: pick(IMAGE_STYLES),
    image_mood: pick(IMAGE_MOODS),
    timestamp_ms: Date.now(),   // guarantees uniqueness even if other picks collide
  }
}

function buildImagePrompt(keywords: string[], style: string, mood: string): string {
  const subject = keywords.slice(0, 3).join(', ')
  return `Professional blog header image for article about: ${subject}. Style: ${style}. Mood: ${mood}. High quality, no text, no words, no letters anywhere in image.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      keyword_id,
      article_id,
      client_id,
      main_keyword,
      selected_keywords,
      all_keywords,
    } = body


    if (!keyword_id || !client_id || !main_keyword) {
      return NextResponse.json({
        error: `Missing required fields: ${[
          !keyword_id && 'keyword_id',
          !client_id && 'client_id',
          !main_keyword && 'main_keyword',
        ].filter(Boolean).join(', ')}`
      }, { status: 400 })
    }

    if (!Array.isArray(all_keywords) || all_keywords.length === 0) {
      return NextResponse.json({ error: 'all_keywords must be a non-empty array' }, { status: 400 })
    }


    let resolvedArticleId = article_id
    if (!resolvedArticleId) {
      const { data: kwRow } = await supabase
        .from('keywords')
        .select('article_id')
        .eq('id', keyword_id)
        .single()
      resolvedArticleId = kwRow?.article_id
    }

    if (!resolvedArticleId) {
      return NextResponse.json({
        error: 'No article linked to this keyword. WF1 must run first.'
      }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('keywords')
      .select('id, status')
      .eq('id', keyword_id)
      .single()

    if (existing?.status === 'queued' || existing?.status === 'used') {
      return NextResponse.json({
        success: true,
        already_queued: true,
        message: `Keyword already in status: ${existing.status}`,
      })
    }

    const variation = buildContentVariation()
    const imagePrompt = buildImagePrompt(all_keywords, variation.image_style, variation.image_mood)

    // ── 1. Update keyword ─────────────────────────────────────
    const { error: kwError } = await supabase
      .from('keywords')
      .update({
        status: 'researched',
        selected_related_keywords: selected_keywords,
        all_selected_keywords: all_keywords,
        queued_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyword_id)

    if (kwError) {
      console.error('[publish-keyword] keyword update failed:', kwError)
      return NextResponse.json({ error: kwError.message }, { status: 500 })
    }

    // ── 2. Update article ─────────────────────────────────────
    const { data: article, error: artError } = await supabase
      .from('articles')
      .update({
        status: 'new',
        image_prompt: imagePrompt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolvedArticleId)
      .select('id, keyword, client_id, target_word_count, target_audience, content_type, language')
      .single()

    if (artError) {
      console.error('[publish-keyword] article update failed:', artError)
      await supabase.from('keywords').update({ status: 'researched' }).eq('id', keyword_id)
      return NextResponse.json({ error: artError.message }, { status: 500 })
    }

    // ── 3. Fetch client ───────────────────────────────────────
    const { data: client } = await supabase
      .from('clients')
      .select('name, domain, niche, tone, publish_url, publish_platform')
      .eq('id', client_id)
      .single()

    const wf2WebhookUrl = (process.env as any).WF2_WEBHOOK_URL as string

    if (!wf2WebhookUrl) {
      console.warn('[publish-keyword] WF2_WEBHOOK_URL not set — skipping webhook')
    } else {
      const webhookPayload = {

        article_id: resolvedArticleId,
        keyword_id,
        client_id,


        primary_keyword: main_keyword,
        selected_keywords,
        all_keywords,

        target_word_count: article?.target_word_count || 1500,
        target_audience: article?.target_audience || 'general audience',
        content_type: article?.content_type || 'blog_post',
        language: article?.language || 'en',

        client_name: client?.name || '',
        client_domain: client?.domain || '',
        client_niche: client?.niche || '',
        client_tone: client?.tone || 'professional',
        publish_url: client?.publish_url || '',
        publish_platform: client?.publish_platform || '',

        variation_seed: variation.variation_seed,   // unique number — use in prompt
        content_angle: variation.content_angle,    // e.g. "comprehensive guide"
        writing_style: variation.writing_style,    // e.g. "conversational and friendly"
        intro_hook: variation.intro_hook,       // e.g. "start with a question"
        image_style: variation.image_style,      // e.g. "clean flat design illustration"
        image_mood: variation.image_mood,       // e.g. "warm and inviting"
        image_prompt: imagePrompt,                // full prompt for image generation
        is_regeneration: false,
        generation: 1,

        triggered_by: 'human_approval',
        triggered_at: new Date().toISOString(),
      }

      try {
        console.log(`[publish-keyword] Firing WF2 webhook — seed: ${variation.variation_seed}, angle: ${variation.content_angle}`)

        const webhookRes = await fetch(wf2WebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(15_000),
        })
        console.log('publish keyword route called', wf2WebhookUrl)

        if (webhookRes.ok) {
          console.log('[publish-keyword] ✅ WF2 webhook fired successfully')
        } else {
          const errBody = await webhookRes.text()
          console.error(`[publish-keyword] ❌ WF2 returned ${webhookRes.status}:`, errBody)
        }
      } catch (webhookErr: any) {
        if (webhookErr.name === 'TimeoutError') {
          console.error('[publish-keyword] ❌ n8n timeout — set Webhook to "Respond: Immediately"')
        } else {
          console.error('[publish-keyword] ❌ webhook error:', webhookErr.message)
        }
      }
    }

    // ── 5. Log event ──────────────────────────────────────────
    await supabase.from('agent_logs').insert({
      client_id,
      article_id: resolvedArticleId,
      agent_name: 'human_approval',
      action: 'article_queued_by_user',
      status: 'ok',
      details: JSON.stringify({
        keyword_id,
        main_keyword,
        selected_count: selected_keywords.length,
        total_keywords: all_keywords.length,
        all_keywords,
        variation_seed: variation.variation_seed,
        content_angle: variation.content_angle,
        writing_style: variation.writing_style,
        wf2_webhook_fired: !!wf2WebhookUrl,
      }),
    }).then(({ error }) => {
      if (error) console.warn('[log] agent_logs insert failed:', error.message)
    })

    return NextResponse.json({
      success: true,
      keyword_id,
      article_id: resolvedArticleId,
      status: 'researched',
      keywords_count: all_keywords.length,
      variation_seed: variation.variation_seed,
      content_angle: variation.content_angle,
      wf2_triggered: !!wf2WebhookUrl,
    })

  } catch (err: any) {
    console.error('[publish-keyword] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'publish-keyword API running' })
}