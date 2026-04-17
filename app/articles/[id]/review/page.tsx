import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ArticleReviewClient from './ArticleReviewClient'

export const revalidate = 0

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ArticleReviewPage({ params }: { params: { id: string } }) {

  const id = Number(params.id)
  if (isNaN(id)) notFound()


  const { data: article, error } = await sb
    .from('articles')
    .select(`
      id, client_id, keyword, keyword_normalized, slug,
      status, generation, parent_article_id,
      content, meta_title, meta_description,
      tags, focus_keyword, canonical_url,
      featured_image_url, image_prompt, image_source,
      target_word_count, target_audience, content_type, language,
      review_feedback, human_review_notes, reviewed_by, reviewed_at,
      revision_count, wp_url, published_at,
      created_at, updated_at,
      clients (
        id, name, domain, niche, tone
      )
    `)
    .eq('id', id)
    .single()

  if (error || !article) {
    console.error("Supabase error or missing article:", error?.message);
    notFound();
  }



  const { data: keywords } = await sb

    .from('keywords')
    .select('*')
    .eq('article_id', id)
    .order('is_primary', { ascending: false })



  const wordCount = article.content
    ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    : 0

  const { data: versions } = await sb
    .from('articles')
    .select('id, generation, status, created_at')
    .eq('client_id', article.client_id)
    .eq('keyword_normalized', article.keyword_normalized)
    .order('generation', { ascending: false })

  console.log(versions)

  const reviewData = {
    article: { ...article, version: article.generation }, // Map generation to version for UI
    client: article.clients,
    keywords: keywords || [],
    wordCount,
    versions: (versions || []).map(v => ({ ...v, version: v.generation })),
  }

  return <ArticleReviewClient data={reviewData} />
}