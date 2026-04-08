// app/api/clients/route.ts
// GET  /api/clients       — list all clients with stats
// POST /api/clients       — create a new client

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niche  = searchParams.get('niche')
  const search = searchParams.get('q')

  let query = sb
    .from('clients')
    .select('id, name, email, domain, niche, tone, schedule, publish_platform, publish_url, notes, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (niche)  query = query.ilike('niche', `%${niche}%`)
  if (search) query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Required: at least name or domain
  if (!body.name && !body.domain) {
    return NextResponse.json({ error: 'name or domain is required' }, { status: 400 })
  }

  const { data, error } = await sb
    .from('clients')
    .insert({
      name:             body.name             || null,
      email:            body.email            || null,
      domain:           body.domain           || null,
      niche:            body.niche            || null,
      tone:             body.tone             || 'Professional',
      schedule:         body.schedule         || 'Weekly',
      publish_platform: body.publish_platform || 'wordpress',
      publish_url:      body.publish_url      || null,
      notes:            body.notes            || null,
      keywords:         body.keywords         || null,
      competitors:      body.competitors      || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log
  await sb.from('agent_logs').insert({
    client_id:  data.id,
    agent_name: 'dashboard',
    action:     'client_created',
    status:     'ok',
    details:    JSON.stringify({ name: data.name, domain: data.domain }),
  }).then(({ error: e }) => { if (e) console.warn('[log]', e.message) })

  return NextResponse.json(data, { status: 201 })
}