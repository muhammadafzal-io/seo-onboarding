// app/api/analytics/realtime/route.ts
// GET /api/analytics/realtime?clientId=X
// Returns activeUsers, topPages, topCountries from GA4 Realtime API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRealtime, getAccessToken } from '../../../../lib/client'


const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  }

  try {
    // Load GA property for this client
    const { data: prop, error: propErr } = await sb
      .from('client_ga_properties')
      .select('property_id, credentials_json')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (propErr || !prop) {
      return NextResponse.json({ error: 'No active GA property for this client' }, { status: 404 })
    }

    // Get OAuth token
    const token = await getAccessToken(prop.credentials_json)

    // Normalise property ID → must start with 'properties/'
    const propertyId = String(prop.property_id).startsWith('properties/')
      ? prop.property_id
      : `properties/${prop.property_id}`

    // Fetch realtime data from GA4
    const realtime = await fetchRealtime(propertyId, token)
  

    // Return with fully mapped fields — component reads all three
    return NextResponse.json({
      activeUsers:   realtime.activeUsers   || 0,
      topPages:      realtime.topPages      || [],   // [{ pagePath, activeUsers }]
      topCountries:  realtime.topCountries  || [],   // [{ country, activeUsers }]
      fetchedAt:     new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })

  } catch (e: any) {
    console.error('[realtime]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}