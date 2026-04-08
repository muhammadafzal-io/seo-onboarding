// app/api/clients/[id]/route.ts
// GET    /api/clients/:id  — single client with full stats
// PATCH  /api/clients/:id  — update client fields
// DELETE /api/clients/:id  — delete client (cascades to articles + keywords via FK)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const { data, error } = await sb
    .from('clients')
    .select(`
      id, name, email, domain, niche, tone, schedule,
      publish_platform, publish_url, notes, keywords, competitors,
      created_at, updated_at,
      articles ( id, status, keyword, updated_at )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Compute stats
  const arts = (data as any).articles || []
  const stats = {
    total:      arts.length,
    published:  arts.filter((a: any) => a.status === 'published').length,
    inPipeline: arts.filter((a: any) => !['published','failed'].includes(a.status)).length,
    failed:     arts.filter((a: any) => a.status === 'failed').length,
    written:    arts.filter((a: any) => a.status === 'written').length,
    processing: arts.filter((a: any) => a.status === 'processing').length,
  }

  return NextResponse.json({ ...data, stats })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id   = Number(params.id)
  const body = await req.json()
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  // Only allow updatable fields
  const allowed = ['name','email','domain','niche','tone','schedule','publish_platform','publish_url','notes','keywords','competitors']
  const update  = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )
  update['updated_at'] = new Date().toISOString()

  const { data, error } = await sb
    .from('clients')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('agent_logs').insert({
    client_id:  id,
    agent_name: 'dashboard',
    action:     'client_updated',
    status:     'ok',
    details:    JSON.stringify({ fields: Object.keys(update) }),
  })

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  // Cascades to articles + keywords via ON DELETE CASCADE FK (add below if not already set)
  const { error } = await sb.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('agent_logs').insert({
    agent_name: 'dashboard',
    action:     'client_deleted',
    status:     'ok',
    details:    JSON.stringify({ client_id: id }),
  })

  return NextResponse.json({ success: true, deleted_id: id })
}