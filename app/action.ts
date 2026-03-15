import { supabase } from "../lib/supabase"

export async function submitOnboarding(formData: FormData) {
  'use server'

  // ── Debug: log everything received ────────────────────────
  const allFields: Record<string, string> = {}
  formData.forEach((value, key) => { allFields[key] = value as string })
  console.log('Form fields received:', JSON.stringify(allFields, null, 2))

  // ── Extract fields (safe null handling) ───────────────────
  const get = (key: string) => (formData.get(key) as string | null)?.trim() || ''

  const name = get('name')
  const email = get('email')
  const domain = get('domain')
  const niche = get('niche')
  const competitors = get('competitors')
  const keywords = get('keywords')
  const tone = get('tone')
  const publish_url = get('publish_url')
  const publish_platform = get('publish_platform') || null
  const schedule = get('schedule')
  const notes = get('notes') || null

  // ── NEW per-article requirement fields ────────────────────
  const target_word_count = parseInt(get('target_word_count')) || 1500
  const target_audience = get('target_audience') || 'general audience'
  const content_type = get('content_type') || 'blog_post'
  const language = get('language') || 'en'

  // ── Validate before hitting the DB ────────────────────────
  const missing: string[] = []
  if (!name) missing.push('name')
  if (!email) missing.push('email')
  if (!domain) missing.push('domain')
  if (!niche) missing.push('niche')
  if (!competitors) missing.push('competitors')
  if (!keywords) missing.push('keywords')
  if (!tone) missing.push('tone')
  if (!publish_url) missing.push('publish_url')
  if (!schedule) missing.push('schedule')

  if (missing.length > 0) {
    console.error('Missing fields:', missing)
    return { success: false, error: `Missing required fields: ${missing.join(', ')}` }
  }

  // ── 1. Upsert client ──────────────────────────────────────
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .upsert(
      {
        name,
        email,
        domain: domain.replace(/^https?:\/\//, '').toLowerCase(),
        niche,
        competitors,
        keywords,
        tone,
        publish_url,
        publish_platform,
        schedule,
        notes,
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single()

  if (clientError) {
    console.error('Client upsert error:', clientError)
    return { success: false, error: clientError.message }
  }

  // ── 2. Split + LIFO sort keywords ─────────────────────────
  // .reverse() = LIFO: last keyword entered → lowest created_at → picked first by WF1
  const keywordList = keywords
    .split(',')
    .map((k: string) => k.trim().toLowerCase())
    .filter((k: string) => k.length > 0)
  //.reverse()   // LIFO

  if (keywordList.length === 0) {
    return { success: false, error: 'Please enter at least one keyword.' }
  }
  console.log('keywords', keywords)
  console.log('keywordList', keywordList,)
  // ── 3. Group keywords into batches of 3 ───────────────────
  // Each batch  → 1 row in articles table
  // Each keyword → 1 row in keywords table linked to that article
  // WF2 writes ONE article optimised for ALL keywords in the batch
  const BATCH_SIZE = 3
  const batches: string[][] = []
  console.log('batches', batches)
  for (let i = 0; i < keywordList.length; i += BATCH_SIZE) {
    batches.push(keywordList.slice(i, i + BATCH_SIZE))
  }

  console.log(`${keywordList.length} keywords → ${batches.length} articles (${BATCH_SIZE} per batch)`)

  let totalArticles = 0
  let totalKeywords = 0

  for (const batch of batches) {
    const primaryKeyword = batch[0]   // first = primary (H1, meta title anchor)

    // ── 3a. Upsert one article per batch ───────────────────
    const { data: article, error: artError } = await supabase
      .from('articles')
      .upsert(
        {
          client_id: client.id,
          keyword: primaryKeyword,
          keyword_normalized: primaryKeyword,
          status: 'scouted',
          target_word_count,
          target_audience,
          content_type,
          language,
          priority: 0,
        },
        {
          onConflict: 'client_id,keyword_normalized',
          ignoreDuplicates: true,
        }
      )
      .select('id')
      .single()

    if (artError || !article) {
      console.error(`Article upsert failed for "${primaryKeyword}":`, artError?.message)
      continue   // skip this batch, don't fail entire submission
    }

    totalArticles++
    console.log('totalArticles', totalArticles)
    console.log('totalKeywords', totalKeywords)

    // ── 3b. Insert all keywords for this article ───────────
    // is_primary = true  → keyword[0]: used in H1, meta title, first paragraph
    // is_primary = false → keyword[1,2]: woven naturally into body copy
    const keywordRows = batch.map((kw, index) => ({
      article_id: article.id,
      client_id: client.id,
      keyword: kw,
      keyword_normalized: kw,
      is_primary: index === 0,
      status: 'scouted',
    }))
    console.log('keywordRows', keywordRows)

    const { error: kwError } = await supabase
      .from('keywords')
      .upsert(keywordRows, {
        onConflict: 'article_id,keyword_normalized',
        ignoreDuplicates: true,
      })

    if (kwError) {
      console.warn(`Keywords insert warning for article ${article.id}:`, kwError.message)
    } else {
      totalKeywords += keywordRows.length
    }
  }

  // ── 4. Log onboarding event (non-fatal) ───────────────────
  await supabase.from('agent_logs').insert({
    client_id: client.id,
    agent_name: 'onboarding',
    action: 'client_onboarded',
    details: `${totalKeywords} keywords across ${totalArticles} articles. ` +
      `Type: ${content_type}. Lang: ${language}. Words: ~${target_word_count}. ` +
      `Notes: ${notes || 'none'}`,
  }).then(({ error }) => {
    if (error) console.warn('Log insert warning (non-fatal):', error.message)
  })

  return {
    success: true,
    clientId: client.id,
    totalArticles,
    totalKeywords,
  }
}