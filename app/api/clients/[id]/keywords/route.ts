import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const clientId = Number(params.id)
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 })
  }

  const { data, error } = await sb
    .from('keywords')
    .select(`
      id,
      keyword,
      status,
      is_primary,
      created_at,
      search_volumes,
      related_keywords,
      selected_related_keywords,
      all_selected_keywords,
      client_id,
      article_id,
      articles ( id, status )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const keywords = (data || []).map((kw: any) => {
    const linkedArticle = Array.isArray(kw.articles) ? kw.articles[0] : kw.articles

    return {
      ...kw,
      article_status: linkedArticle?.status ?? null,
    }
  })

  return NextResponse.json({ keywords })
}

