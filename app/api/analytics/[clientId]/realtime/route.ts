import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRealtime, getAccessToken } from '../../../../../lib/client'


const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const clientId = Number(params.clientId)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 })

  const { data: prop } = await sb
    .from('client_ga_properties')
    .select('property_id, credentials_json')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single()

  if (!prop?.credentials_json) {
    return NextResponse.json({ error: 'No GA property configured' }, { status: 404 })
  }

  try {
    const token = await getAccessToken(prop.credentials_json)
    const data = await fetchRealtime(prop.property_id, token)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}