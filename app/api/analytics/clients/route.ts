import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  console.log('hello from clients api route')
  const { data, error } = await sb
    .from('clients')
    .select(`
      id, name, domain, niche,
      client_ga_properties (
        id, property_id, property_name, timezone, currency,
        is_active, last_synced_at, last_sync_error,
        service_account_email
      )
    `)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten: attach first active GA property to each client
  const clients = (data || []).map((c: any) => {
    const props = Array.isArray(c.client_ga_properties)
      ? c.client_ga_properties
      : c.client_ga_properties ? [c.client_ga_properties] : []

    return {
      id:          c.id,
      name:        c.name,
      domain:      c.domain,
      niche:       c.niche,
      ga_property: props.find((p: any) => p.is_active) || null,
    }
  })

  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    client_id,
    property_id,
    property_name,
    timezone       = 'UTC',
    currency       = 'USD',
    credentials_json,
    service_account_email,
  } = body

  if (!client_id || !property_id) {
    return NextResponse.json({ error: 'client_id and property_id are required' }, { status: 400 })
  }

  // Validate property_id format
  if (!property_id.startsWith('properties/')) {
    return NextResponse.json(
      { error: 'property_id must start with "properties/" e.g. "properties/123456789"' },
      { status: 400 }
    )
  }

  const { data, error } = await sb
    .from('client_ga_properties')
    .upsert({
      client_id,
      property_id,
      property_name:          property_name || null,
      timezone,
      currency,
      credentials_json:       credentials_json || null,
      service_account_email:  service_account_email || null,
      is_active:              true,
    }, { onConflict: 'client_id,property_id' })
    .select('id, property_id, property_name, is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, property: data }, { status: 201 })
}