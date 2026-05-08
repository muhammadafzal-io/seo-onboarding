
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  console.log('hello from clients api route get')
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche')
  const search = searchParams.get('q')

  let query = sb
    .from('clients')
    .select('id, name, email, domain, niche, tone, schedule, publish_platform, publish_url, notes, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (niche) query = query.ilike('niche', `%${niche}%`)
  if (search) query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  console.log('[clients][POST] Route called:', req.url)
  const body = await req.json()
  console.log('[clients][POST] Incoming payload:', body)

  if (!body.name && !body.domain) {
    return NextResponse.json({ error: 'name or domain is required' }, { status: 400 })
  }

  const { data: newClient, error } = await sb
    .from('clients')
    .insert({
      name: body.name || null,
      email: body.email || null,
      domain: body.domain || null,
      niche: body.niche || null,
      tone: body.tone || 'Professional',
      schedule: body.schedule || 'Weekly',
      publish_platform: body.publish_platform || 'wordpress',
      publish_url: body.publish_url || null,
      notes: body.notes || null,
      keywords: body.keywords || null,
      competitors: body.competitors || null,
      important_service_page: body.important_service_page || null,
      facebook_url: body.facebook_url || null,
      linkedin_url: body.linkedin_url || null,
      twitter_url: body.twitter_url || null,
      instagram_url: body.instagram_url || null,
      context_ready: false,
    })
    .select()
    .single()
  console.log('this is the data......', newClient)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  console.log('this is the data', newClient)
  const scrapeWebhookUrl = process.env.N8N_SCRAPE_WEBHOOK_URL

  const scrapePayload = {
    client_id: newClient.id,
    domain: newClient.domain,
    important_service_page: newClient.important_service_page,
  }

  if (scrapeWebhookUrl && scrapeWebhookUrl !== 'scrape_webhook_url') {
    // Send to n8n
    try {
      await fetch(scrapeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapePayload),
        signal: AbortSignal.timeout(5000),
      })
      console.log('[onboarding] Scrape webhook triggered for client', newClient.id)
    } catch (e: any) {
      console.warn('[onboarding] n8n webhook failed, falling back to direct API:', e.message)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapePayload),
      }).catch(err => console.warn('[onboarding] Direct scrape also failed:', err.message))
    }
  } else {
    // No n8n — call scrape API directly
    console.log('[onboarding] No n8n webhook — calling scrape API directly')
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrapePayload),
    }).catch(err => console.warn('[onboarding] Scrape API call failed:', err.message))
  }

  // Log
  await sb.from('agent_logs').insert({

    agent_name: 'dashboard',
    action: 'client_created',
    status: 'ok',
    details: JSON.stringify({ name: newClient.name, domain: newClient.domain }),
  }).then(({ error: e }) => { if (e) console.warn('[log]', e.message) })

  return NextResponse.json(newClient, { status: 201 })
}