import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DATE_RANGES } from '../../../../types/analytics'
import {
  fetchChannels,
  fetchGeo,
  fetchDeviceSplit,
  fetchOverview,
  fetchTopPages,
  getAccessToken,
} from '../../../../lib/client'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest, { params }: { params: { clientId: string } }) {
  const { clientId } = params
  const { searchParams } = new URL(req.url)
  const rangeKey = searchParams.get('range') || '28d'
  const range = DATE_RANGES.find(r => r.key === rangeKey) || DATE_RANGES[2]

  try {
    const { data: prop, error: propErr } = await sb
      .from('client_ga_properties')
      .select('property_id, credentials_json')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (propErr || !prop) {
      return NextResponse.json({ error: 'No active GA property for this client' }, { status: 404 })
    }

    const token = await getAccessToken(prop.credentials_json)
    const propertyId = String(prop.property_id).startsWith('properties/')
      ? prop.property_id
      : `properties/${prop.property_id}`

    const [overview, channels, topPages, devices, geo] = await Promise.all([
      fetchOverview(propertyId, token, range),
      fetchChannels(propertyId, token, range),
      fetchTopPages(propertyId, token, range),
      fetchDeviceSplit(propertyId, token, range),
      fetchGeo(propertyId, token, range),
    ])

    return NextResponse.json({
      propertyId,
      fetchedAt: new Date().toISOString(),
      fromCache: false,
      overview,
      channels,
      topPages,
      devices,
      geo,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: any) {
    console.error('[analytics dashboard]', error)
    return NextResponse.json({ error: error?.message || 'Unable to fetch analytics data' }, { status: 500 })
  }
}
