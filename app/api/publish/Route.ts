// import { NextRequest, NextResponse } from 'next/server'
// import { revalidatePath } from 'next/cache'
// import { supabase } from '../../../lib/supabase'
// import { sendArticlePublishedAdmin, sendArticlePublishedClient } from '../../../lib/email'

// export async function GET() {
//   return NextResponse.json({ status: 'API running', secret_set: !!process.env.PUBLISH_SECRET })
// }

// export async function POST(req: NextRequest) {
//   try {
//     if (process.env.PUBLISH_SECRET) {
//       const incoming = req.headers.get('x-api-key')
//       if (incoming !== process.env.PUBLISH_SECRET) {
//         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//       }
//     }

//     const body = await req.json()
//     const { article_id } = body
//     if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

//     // Fetch article + client in one join
//     const { data: article, error: fetchError } = await supabase
//       .from('articles')
//       .select(`id, keyword, meta_title, meta_description, status, clients(name, email, domain, publish_url)`)
//       .eq('id', article_id)
//       .single()

//     if (fetchError || !article) {
//       return NextResponse.json({ error: 'Article not found', details: fetchError?.message }, { status: 404 })
//     }

//     const articleUrl = `https://seo-blog-sage.vercel.app/blog/${article.id}`

//     const { error: updateError } = await supabase
//       .from('articles')
//       .update({ status: 'published', wp_url: articleUrl, wp_post_id: String(article.id), updated_at: new Date().toISOString() })
//       .eq('id', article_id)

//     if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

//     revalidatePath(`/blog/${article.id}`)
//     revalidatePath('/')

//     // Get client info safely
//     const client = Array.isArray(article.clients) ? article.clients[0] : article.clients as any

//     // Send emails (non-fatal — don't block the publish response)
//     if (client) {
//       Promise.allSettled([
//         sendArticlePublishedAdmin({
//           keyword:         article.keyword,
//           domain:          client.domain || '',
//           articleUrl,
//           metaTitle:       article.meta_title || article.keyword,
//           metaDescription: article.meta_description || '',
//           clientName:      client.name || '',
//         }),
//         sendArticlePublishedClient({
//           clientEmail: client.email || '',
//           clientName:  client.name || '',
//           keyword:     article.keyword,
//           articleUrl,
//           metaTitle:   article.meta_title || article.keyword,
//           domain:      client.domain || '',
//         }),
//       ]).then(results => {
//         results.forEach((r, i) => {
//           if (r.status === 'rejected') console.error(`[publish email ${i}]`, r.reason)
//         })
//       })
//     }

//     return NextResponse.json({ success: true, article_id: article.id, url: articleUrl, title: article.meta_title || article.keyword })

//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 })
//   }
// }