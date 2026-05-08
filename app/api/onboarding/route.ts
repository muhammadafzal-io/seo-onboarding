import { NextRequest, NextResponse } from 'next/server'
import { sendClientOnboardedAdmin, sendWelcomeEmail } from '../../../lib/email'
import { supabase } from '../../../lib/supabase'

type OnboardingPayload = {
  name?: string
  email?: string
  domain?: string
  niche?: string
  competitors?: string
  keywords?: string
  tone?: string
  publish_url?: string
  publish_platform?: string
  schedule?: string
  notes?: string
  target_word_count?: string | number
  target_audience?: string
  content_type?: string
  language?: string
  important_service_page?: string
}

export async function POST(req: NextRequest) {
  

  const body = (await req.json()) as OnboardingPayload
  const get = (key: keyof OnboardingPayload) => String(body[key] ?? '').trim()
  const normalizeKeyword = (kw: string): string => kw.trim().toLowerCase()

  const name = get('name')
  const email = get('email')
  const domain = get('domain')
  const niche = get('niche')
  const competitors = get('competitors')
  const keywords = get('keywords')
  const tone = get('tone')
  const publish_url = get('publish_url')
  const publish_platform = get('publish_platform') || null
  const schedule = get('schedule')
  const notes = get('notes') || null

  const parsedWordCount = Number(get('target_word_count'))
  const target_word_count = Number.isFinite(parsedWordCount) && parsedWordCount > 0 ? parsedWordCount : 1500
  const target_audience = get('target_audience') || 'general audience'
  const content_type = get('content_type') || 'blog_post'
  const language = get('language') || 'en'
  const important_service_page = get('important_service_page') || null

  console.log('[onboarding][POST] payload received:', {
    name,
    email,
    domain,
    niche,
    competitors,
    keywords,
    tone,
    publish_url,
    publish_platform,
    schedule,
    notes,
    target_word_count,
    target_audience,
    content_type,
    language,
    important_service_page,
  })

  const missing: string[] = []
  if (!name) missing.push('name')
  if (!email) missing.push('email')
  if (!domain) missing.push('domain')
  if (!niche) missing.push('niche')
  if (!competitors) missing.push('competitors')
  if (!keywords) missing.push('keywords')
  if (!tone) missing.push('tone')
  if (!publish_url) missing.push('publish_url')
  if (!schedule) missing.push('schedule')

  if (missing.length > 0) {

    return NextResponse.json({ success: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .upsert(
      {
        name,
        email,
        domain: domain.replace(/^https?:\/\//, '').toLowerCase(),
        niche,
        competitors,
        keywords,
        tone,
        publish_url,
        publish_platform,
        schedule,
        notes,
        important_service_page,
      },
      { onConflict: 'email' }
    )
    .select('id, domain, important_service_page, facebook_url, linkedin_url')
    .single()

  if (clientError || !client) {
   
    return NextResponse.json({ success: false, error: clientError?.message || 'Client creation failed' }, { status: 500 })
  }


  let scrapeStatus: 'success' | 'failed' | 'skipped' = 'skipped'
  let scrapeMessage = 'Webhook URL is not configured'
  const scrapeWebhookUrl = process.env.N8N_SCRAPE_WEBHOOK_URL
  const scrapePayload = {
    client_id: client.id,
    domain: client.domain,
    important_service_page: client.important_service_page,
    facebook_url: client.facebook_url ?? null,
    linkedin_url: client.linkedin_url ?? null,
  }

  if (scrapeWebhookUrl) {
    console.log('[onboarding][POST] Triggering scrape webhook:', {
      webhookUrl: scrapeWebhookUrl,
      payload: scrapePayload,
    })

    try {
      const scrapeRes = await fetch(scrapeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapePayload),
      })
      const responseText = await scrapeRes.text()

      if (!scrapeRes.ok) {
        scrapeStatus = 'failed'
        scrapeMessage = `Webhook failed: ${scrapeRes.status}`
        console.warn('[onboarding][POST] Scrape webhook failed:', {
          status: scrapeRes.status,
          responseText,
          webhookUrl: scrapeWebhookUrl,
          payload: scrapePayload,
        })
      } else {
        scrapeStatus = 'success'
        scrapeMessage = 'Webhook triggered successfully'
        console.log('[onboarding][POST] Scrape webhook success:', {
          status: scrapeRes.status,
          responseText,
          webhookUrl: scrapeWebhookUrl,
          payload: scrapePayload,
        })
      }
    } catch (e: unknown) {
      const base = e instanceof Error ? e.message : 'Unknown error'
      const cause = e instanceof Error ? e.cause : undefined
      const causeSuffix =
        cause instanceof Error && cause.message && cause.message !== base
          ? ` (${cause.message})`
          : typeof cause === 'object' &&
              cause &&
              'code' in cause &&
              typeof (cause as { code?: unknown }).code === 'string'
            ? ` (${(cause as { code: string }).code})`
            : ''
      const message = `${base}${causeSuffix}`
      scrapeStatus = 'failed'
      scrapeMessage = `Webhook error: ${message}`
      console.warn('[onboarding][POST] Scrape webhook error:', {
        message,
        webhookUrl: scrapeWebhookUrl,
        payload: scrapePayload,
      })
    }
  } else {
    console.warn('[onboarding][POST] Scrape trigger skipped: webhook URL is not configured')
  }

  const keywordList = Array.from(new Set(keywords.split(',').map(normalizeKeyword).filter(k => k.length > 0)))
  if (keywordList.length === 0) {
    return NextResponse.json({ success: false, error: 'Please enter at least one keyword.' }, { status: 400 })
  }

  const keywordString = keywordList.join(', ')
  const imagePrompt =
    `Professional blog header image representing: ${keywordString}. ` +
    `Industry: ${niche}. Clean modern photography style, ` +
    `high quality, absolutely no text or words in the image.`

  const { data: article, error: artError } = await supabase
    .from('articles')
    .upsert(
      {
        client_id: client.id,
        keyword: keywordString,
        keyword_normalized: keywordString,
        status: 'scouted',
        generation: 1,
        target_word_count,
        target_audience,
        content_type,
        language,
        priority: 0,
        image_prompt: imagePrompt,
      },
      {
        onConflict: 'client_id,keyword_normalized,generation',
        ignoreDuplicates: true,
      }
    )
    .select('id')
    .single()

  if (artError || !article) {
    console.error('[onboarding][POST] article upsert failed:', artError?.message)
    return NextResponse.json({ success: false, error: artError?.message || 'Article creation failed' }, { status: 500 })
  }
  console.log('[onboarding][POST] article upsert success:', { articleId: article.id, clientId: client.id })

  const keywordRows = keywordList.map((kw, index) => ({
    article_id: article.id,
    client_id: client.id,
    keyword: kw,
    keyword_normalized: normalizeKeyword(kw),
    is_primary: index === 0,
    status: 'scouted',
  }))

  const { error: kwError } = await supabase
    .from('keywords')
    .upsert(keywordRows, {
      onConflict: 'article_id,keyword_normalized',
      ignoreDuplicates: true,
    })

  if (kwError) {
    console.warn('[onboarding][POST] keywords upsert warning:', kwError.message)
  } else {
    console.log('[onboarding][POST] keywords upsert success:', { count: keywordRows.length, articleId: article.id })
  }

  await supabase
    .from('agent_logs')
    .insert({
      client_id: client.id,
      agent_name: 'onboarding',
      action: 'client_onboarded',
      details: `${keywordList.length} keywords -> 1 article (gen 1). Type: ${content_type}. Lang: ${language}.`,
    })
    .then(({ error }) => {
      if (error) {
        console.warn('[onboarding][POST] agent log insert failed:', error.message)
      } else {
        console.log('[onboarding][POST] agent log insert success:', { clientId: client.id })
      }
    })

  const emailResults = await Promise.allSettled([
    sendClientOnboardedAdmin({
      clientName: name,
      clientEmail: email,
      domain,
      niche,
      keywordCount: keywordList.length,
      schedule,
      publishUrl: publish_url,
    }),
    sendWelcomeEmail({
      clientName: name,
      clientEmail: email,
      domain,
      keywordCount: keywordList.length,
      publishUrl: publish_url,
      schedule,
    }),
  ])
  console.log('[onboarding][POST] email results (non-fatal):', emailResults)

  return NextResponse.json(
    {
      success: true,
      client_id: client.id,
      scrape_status: scrapeStatus,
      scrape_message: scrapeMessage,
      totalArticles: 1,
      totalKeywords: keywordList.length,
    },
    { status: 201 }
  )
}
