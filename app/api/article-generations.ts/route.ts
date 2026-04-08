// app/api/article-generations/route.ts
// GET /api/article-generations?root_id=123&keyword=pure+water
// Returns all versions (generations) of an article grouped by root id or keyword

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rootId  = searchParams.get('root_id')
  const keyword = searchParams.get('keyword')

  if (!rootId && !keyword) {
    return NextResponse.json({ error: 'root_id or keyword required' }, { status: 400 })
  }

  let query = sb
    .from('articles')
    .select('id, status, generation, parent_article_id, meta_title, featured_image_url, regenerate_reason, regenerated_at, created_at, updated_at, wp_url, client_id, keyword')
    .order('generation', { ascending: false })

  if (rootId) {
    const id = Number(rootId)
    // Fetch both the root article AND any article whose parent_article_id = root
    query = query.or(`id.eq.${id},parent_article_id.eq.${id}`)
  } else if (keyword) {
    query = query.ilike('keyword', keyword!)
  }

  const { data, error } = await query.limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ generations: data || [] })
}