'use server'
import { sendClientOnboardedAdmin, sendWelcomeEmail } from "../lib/email"
import { supabase } from "../lib/supabase"

export async function submitOnboarding(formData: FormData) {


  // ── Helpers ──────────────────────────────────────────────
  const get = (key: string) =>
    (formData.get(key) as string | null)?.trim() || ''

  const normalizeKeyword = (kw: string): string =>
    kw?.trim().toLowerCase()

  // ── Get form values ──────────────────────────────────────
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

  const target_word_count = parseInt(get('target_word_count')) || 1500
  const target_audience = get('target_audience') || 'general audience'
  const content_type = get('content_type') || 'blog_post'
  const language = get('language') || 'en'

  // ── Validate ──────────────────────────────────────────────
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

  if (clientError || !client) {
    console.error('Client upsert error:', clientError)
    return { success: false, error: clientError?.message || 'Client creation failed' }
  }

  // ── 2. Parse & normalize keywords ─────────────────────────
  const keywordList = Array.from(
    new Set(
      keywords
        .split(',')
        .map(normalizeKeyword)
        .filter(k => k.length > 0)
    )
  )

  if (keywordList.length === 0) {
    return { success: false, error: 'Please enter at least one keyword.' }
  }

  // ✅ FIXED: defined BEFORE usage
  const keywordString = keywordList.join(', ')
  console.log('keywordString', keywordString)

  const primaryKeyword = keywordList[0]

  const imagePrompt =
    `Professional blog header image representing: ${keywordString}. ` +
    `Industry: ${niche}. Clean modern photography style, ` +
    `high quality, absolutely no text or words in the image.`

  // ── 3. Upsert ONE article ─────────────────────────────────
  const { data: article, error: artError } = await supabase
    .from('articles')
    .upsert(
      {
        client_id: client.id,
        keyword: keywordString,
        keyword_normalized: keywordString,
        status: 'scouted',
        target_word_count,
        target_audience,
        content_type,
        language,
        priority: 0,
        image_prompt: imagePrompt,
      },
      {
        onConflict: 'client_id,keyword_normalized',
        ignoreDuplicates: true,
      }
    )
    .select('id')
    .single()

  if (artError || !article) {
    console.error('Article upsert failed:', artError?.message)
    return { success: false, error: artError?.message || 'Article creation failed' }
  }

  // ── 4. Insert keywords ────────────────────────────────────
  const keywordRows = keywordList.map((kw, index) => ({
    article_id: article.id,
    client_id: client.id,
    keyword: kw,
    keyword_normalized: normalizeKeyword(kw),
    is_primary: index === 0,
    status: 'scouted',
  }))

  const { error: kwError } = await supabase
    .from('keywords')
    .upsert(keywordRows, {
      onConflict: 'article_id,keyword_normalized',
      ignoreDuplicates: true,
    })

  if (kwError) {
    console.warn('Keywords insert warning:', kwError.message)
  }

  await supabase.from('keywords').upsert(keywordRows, { onConflict: 'article_id,keyword_normalized', ignoreDuplicates: true })


  // ── 5. Log onboarding ─────────────────────────────────────
  const { error: logError } = await supabase.from('agent_logs').insert({
    client_id: client.id,
    agent_name: 'onboarding',
    action: 'client_onboarded',
    details:
      `${keywordList.length} keywords → 1 article → 1 image. ` +
      `Keywords: ${keywordString}. ` +
      `Type: ${content_type}. Lang: ${language}. Words: ~${target_word_count}. ` +
      `Notes: ${notes || 'none'}`,
  })

  if (logError) {
    console.warn('Log insert warning (non-fatal):', logError.message)
  }


  // ── 5. Log event ──────────────────────────────────────────
  await supabase.from('agent_logs').insert({
    client_id: client.id, agent_name: 'onboarding', action: 'client_onboarded',
    details: `${keywordList.length} keywords → 1 article. Type: ${content_type}. Lang: ${language}.`,
  }).then(({ error }) => { if (error) console.warn('[log]', error.message) })


  // ── 6. Send emails (non-fatal) ────────────────────────────
  await Promise.allSettled([
    sendClientOnboardedAdmin({ clientName: name, clientEmail: email, domain, niche, keywordCount: keywordList.length, schedule, publishUrl: publish_url }),
    sendWelcomeEmail({ clientName: name, clientEmail: email, domain, keywordCount: keywordList.length, publishUrl: publish_url, schedule }),
  ])

  // ── Response ──────────────────────────────────────────────
  return {
    success: true,
    clientId: client.id,
    totalArticles: 1,
    totalKeywords: keywordList.length,
  }
}