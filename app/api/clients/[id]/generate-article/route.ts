import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getClientGenerationDefaults(clientId: number) {
  const { data: client, error: clientError } = await sb
    .from('clients')
    .select(`
      id, name, email, domain, niche, tone, notes, keywords,
      publish_url, publish_platform, important_service_page,
      facebook_url, linkedin_url, twitter_url, instagram_url
    `)
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return { error: 'Client not found' as const }
  }

  const { data: contextRows } = await sb
    .from('client_context')
    .select('*')
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })
    .limit(1)

  const { data: keywordRows } = await sb
    .from('keywords')
    .select('keyword, is_primary, status, search_volumes, query_score')
    .eq('client_id', clientId)
    .order('is_primary', { ascending: false })
    .order('search_volumes', { ascending: false })
    .limit(50)

  const onboardingKeywords = String(client.keywords || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)

  const keywordPool = Array.from(
    new Set([
      ...((keywordRows || []).map((k: any) => k.keyword).filter(Boolean)),
      ...onboardingKeywords,
    ])
  )

  const websiteUrls = [
    client.domain ? `https://${String(client.domain).replace(/^https?:\/\//, '')}` : null,
    client.publish_url || null,
    client.important_service_page || null,
    client.facebook_url || null,
    client.linkedin_url || null,
    client.twitter_url || null,
    client.instagram_url || null,
  ].filter(Boolean)

  return {
    client,
    context: contextRows?.[0] || null,
    keywordRows: keywordRows || [],
    keywordPool,
    websiteUrls,
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const clientId = Number(params.id)
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 })
  }

  const defaults = await getClientGenerationDefaults(clientId)
  if ('error' in defaults) {
    return NextResponse.json({ error: defaults.error }, { status: 404 })
  }

  return NextResponse.json({
    client_id: clientId,
    client: defaults.client,
    client_context: defaults.context,
    website_urls: defaults.websiteUrls,
    keywords: defaults.keywordPool,
    keyword_rows: defaults.keywordRows,
  })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number(params.id)
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client id' }, { status: 400 })
    }

    const webhookUrl =
      process.env.ARTICLE_GENERATOR_WEBHOOK_URL ||
      process.env.WF2_WEBHOOK_URL ||
      'http://35.172.234.245:5678/webhook/article-generator'

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Article generator webhook is not configured' }, { status: 500 })
    }

    const defaults = await getClientGenerationDefaults(clientId)
    if ('error' in defaults) {
      return NextResponse.json({ error: defaults.error }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const websiteUrls = Array.isArray(body.website_urls)
      ? body.website_urls.map((v: any) => String(v || '').trim()).filter(Boolean)
      : defaults.websiteUrls
    const keywordPool = Array.isArray(body.keywords)
      ? body.keywords.map((v: any) => String(v || '').trim()).filter(Boolean)
      : defaults.keywordPool
    const clientContext = body.client_context || defaults.context

    const payload = {
      client_id: clientId,
      client_context: clientContext,
      website_urls: websiteUrls,
      keywords: keywordPool,
      keyword_rows: defaults.keywordRows || [],
      client: {
        id: defaults.client.id,
        name: defaults.client.name,
        email: defaults.client.email,
        domain: defaults.client.domain,
        niche: defaults.client.niche,
        tone: defaults.client.tone,
        notes: defaults.client.notes,
        publish_platform: defaults.client.publish_platform,
        publish_url: defaults.client.publish_url,
      },
      triggered_by: 'client_page_one_click',
      triggered_at: new Date().toISOString(),
    }

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    })

    const webhookText = await webhookRes.text()
    let webhookBody: any = null
    try {
      webhookBody = webhookText ? JSON.parse(webhookText) : null
    } catch {
      webhookBody = { raw: webhookText }
    }

    if (!webhookRes.ok) {
      return NextResponse.json(
        { error: webhookBody?.error || `Webhook failed with status ${webhookRes.status}` },
        { status: 502 }
      )
    }

    await sb.from('agent_logs').insert({
      client_id: clientId,
      agent_name: 'client_page',
      action: 'article_generator_triggered',
      status: 'ok',
      details: JSON.stringify({
        webhook_url: webhookUrl,
        context_found: !!clientContext,
        website_url_count: websiteUrls.length,
        keyword_count: keywordPool.length,
      }),
    })

    return NextResponse.json({
      success: true,
      message: 'Article generator workflow triggered successfully.',
      context_found: !!clientContext,
      keyword_count: keywordPool.length,
      webhook_response: webhookBody,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to trigger workflow' }, { status: 500 })
  }
}

