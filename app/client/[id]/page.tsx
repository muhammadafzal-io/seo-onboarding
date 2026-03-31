
// app/client/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ClientProfileClient from './ClientProfileClient'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 60

async function getClientProfile(id: number) {
  const [clientRes, statsRes, recentArticles, recentKeywords] = await Promise.all([
    sb.from('clients')
      .select('id, name, email, domain, niche, competitors, keywords, tone, publish_url, publish_platform, schedule, notes, created_at')
      .eq('id', id)
      .single(),

    sb.from('articles')
      .select('status', { count: 'exact' })
      .eq('client_id', id),

    sb.from('articles')
      .select('id, keyword, meta_title, status, target_word_count, updated_at, wp_url')
      .eq('client_id', id)
      .order('updated_at', { ascending: false })
      .limit(8),

    // Joining with articles to get the linked article's status
    sb.from('keywords')
      .select(`
        id,
        keyword,
        article_id,
        client_id,
        search_volumes,
        competition,
        competition_label,
        cpc,
        query_score,
        opportunity_grade,
        related_keywords,
        is_primary,
        status,
        articles ( id, status )
      `)
      .eq('client_id', id)
      .order('search_volumes', { ascending: false })
      .limit(10),
  ])

  if (clientRes.error || !clientRes.data) return null

  const rawArticles = statsRes.data || []
  const statCounts = rawArticles.reduce((acc: Record<string, number>, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  const kwWithVol = (recentKeywords.data || []).filter((k: any) => k.search_volumes > 0)
  const avgVolume = kwWithVol.length > 0
    ? Math.round(kwWithVol.reduce((sum: number, k: any) => sum + k.search_volumes, 0) / kwWithVol.length)
    : 0

 const kwCountRes = await sb.from('keywords').select('id', { count: 'exact', head: true }).eq('client_id', id)
console.log('kwCountRes',kwCountRes)
  // ✅ FIX: Flatten the joined article data
  const processedKeywords = (recentKeywords.data || []).map((kw: any) => {
    // Supabase returns 'articles' as an array because of the join
    const linkedArticle = Array.isArray(kw.articles) ? kw.articles[0] : kw.articles;
    
    return {
      ...kw,
      // Pull the status out of the nested object so the UI can see it
      article_status: linkedArticle?.status ?? null,
      // Fallback for competition label if it's stored in the competition column
      competition_label: kw.competition_label || kw.competition 
    };
  })
 // console.log('processedKeywords',processedKeywords)

  // Log the cleaned data to the terminal to verify


  return {
    client: clientRes.data,
    stats: {
      totalArticles: rawArticles.length,
      published: statCounts['published'] || 0,
      approved: statCounts['approved'] || 0,
      written: statCounts['written'] || 0,
      processing: statCounts['processing'] || 0,
      failed: statCounts['failed'] || 0,
      totalKeywords: kwCountRes.count || 0,
      avgVolume,
    },
    statCounts,
    recentArticles: recentArticles.data || [],
    recentKeywords: processedKeywords, // Pass the cleaned version
  }
}

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (isNaN(id)) notFound()

  const data = await getClientProfile(id)
  if (!data) notFound()

  return <ClientProfileClient data={data} />
}
