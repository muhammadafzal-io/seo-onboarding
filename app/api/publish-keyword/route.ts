// app/api/publish-keyword/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

    // ── Validate required fields ──────────────────────────────
    if (!keyword_id || !client_id || !main_keyword) {
      return NextResponse.json({
        error: `Missing required fields: ${[
          !keyword_id   && 'keyword_id',
          !client_id    && 'client_id',
          !main_keyword && 'main_keyword',
        ].filter(Boolean).join(', ')}`
      }, { status: 400 })
    }

    if (!Array.isArray(all_keywords) || all_keywords.length === 0) {
      return NextResponse.json({ error: 'all_keywords must be a non-empty array' }, { status: 400 })
    }

    // ── Resolve article_id from payload or DB ─────────────────
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

    // ── Check idempotency ─────────────────────────────────────
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

    const imagePrompt = `Professional blog header image representing: ${all_keywords.join(', ')}. Clean modern photography style, no text, no words in image.`

    // ── 1. Update keyword ─────────────────────────────────────
    const { error: kwError } = await supabase
      .from('keywords')
      .update({
        status:                    'researched',
        selected_related_keywords: selected_keywords,
        all_selected_keywords:     all_keywords,
        queued_at:                 new Date().toISOString(),
        updated_at:                new Date().toISOString(),
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
        status:       'new',
        image_prompt: imagePrompt,
        updated_at:   new Date().toISOString(),
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

    // ── 4. Fire WF2 webhook ───────────────────────────────────
    //const wf2WebhookUrl = process.env.WF2_WEBHOOK_URL
    // ── 4. Fire WF2 webhook ───────────────────────────────────
    // Use Type Assertion to fix the ts(2339) error
    const wf2WebhookUrl = (process.env as any).WF2_WEBHOOK_URL as string;

    if (!wf2WebhookUrl) {
      console.warn('[publish-keyword] WF2_WEBHOOK_URL not set — skipping webhook');
    } else {
      const webhookPayload = {
    article_id: resolvedArticleId,
    keyword_id,
    client_id,
    primary_keyword: main_keyword,
    selected_keywords,
    all_keywords,
    image_prompt: imagePrompt,
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
    triggered_by: 'human_approval',
    triggered_at: new Date().toISOString(),
  };

      try {
    console.log(`[publish-keyword] Sending request to n8n: ${wf2WebhookUrl}`);

    const webhookRes = await fetch(wf2WebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(webhookPayload),
      // We keep a reasonable timeout, but n8n must be set to "Respond: Immediately"
      signal: AbortSignal.timeout(15_000),
    });

    if (webhookRes.ok) {
      console.log('[publish-keyword] ✅ WF2 Webhook triggered successfully');
    } else {
      // If n8n sends an error, we capture the text to see if it's HTML or JSON
      const errorBody = await webhookRes.text();
      console.error(`[publish-keyword] ❌ WF2 Webhook returned ${webhookRes.status}:`, errorBody);
    }
  } catch (webhookErr: any) {
    if (webhookErr.name === 'TimeoutError') {
      console.error('[publish-keyword] ❌ n8n took too long to respond. Ensure Webhook node is set to "Respond: Immediately"');
    } else {
      console.error('[publish-keyword] ❌ WF2 webhook network failure:', webhookErr.message);
    }
      }
    }

    // ── 5. Log event ──────────────────────────────────────────
    await supabase.from('agent_logs').insert({
      client_id,
      article_id: resolvedArticleId,
      agent_name: 'human_approval',
      action:     'article_queued_by_user',
      status:     'ok',
      details:    JSON.stringify({
        keyword_id,
        main_keyword,
        selected_count: selected_keywords.length,
        total_keywords: all_keywords.length,
        all_keywords,
        wf2_webhook_fired: !!wf2WebhookUrl,
      }),
    }).then(({ error }) => {
      if (error) console.warn('[log] agent_logs insert failed:', error.message)
    })

    return NextResponse.json({
      success:        true,
      keyword_id,
      article_id:     resolvedArticleId,
      status:         'researched',
      keywords_count: all_keywords.length,
      wf2_triggered:  !!wf2WebhookUrl,
    })

  } catch (err: any) {
    console.error('[publish-keyword] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'publish-keyword API running' })
}