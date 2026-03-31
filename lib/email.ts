import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM || 'noreply@yourdomain.com'
const ADMIN  = process.env.ADMIN_EMAIL || 'admin@yourdomain.com'
const SITE   = 'https://seo-blog-sage.vercel.app'

async function send(to: string | string[], subject: string, html: string) {
  try {
    const { error } = await resend.emails.send({
      from: `SEO Agent Swarm <${FROM}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    if (error) console.error('[email]', error)
    return { success: !error }
  } catch (e) {
    console.error('[email] unexpected:', e)
    return { success: false }
  }
}

function tmpl(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',sans-serif;background:#f5f5f5;padding:32px 16px}
.w{max-width:560px;margin:0 auto}
.hd{background:#171717;border-radius:12px 12px 0 0;padding:24px 32px;display:flex;align-items:center;gap:12px}
.ic{width:34px;height:34px;background:#10a37f;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700}
.nm{font-size:17px;font-weight:600;color:#ececec;letter-spacing:-0.01em}
.sb{font-size:9px;color:#6b6b7b;letter-spacing:0.1em;text-transform:uppercase}
.bd{background:#2f2f2f;padding:28px 32px;border:1px solid #3f3f3f;border-top:none}
h1{font-size:20px;font-weight:600;color:#ececec;margin-bottom:8px;letter-spacing:-0.02em}
p{font-size:14px;color:#8e8ea0;line-height:1.7;margin-bottom:14px}
.hl{color:#ececec;font-weight:500}
.card{background:#262626;border:1px solid #3f3f3f;border-radius:10px;padding:18px;margin:18px 0}
.kv{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #3a3a3a;font-size:13px}
.kv:last-child{border:none}
.kl{color:#6b6b7b}.kv2{color:#ececec;font-weight:500;text-align:right;max-width:300px}
.btn{display:inline-block;background:#10a37f;color:#fff!important;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px}
.badge{display:inline-block;background:#0d2e26;color:#10a37f;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.ft{background:#1e1e1e;border-radius:0 0 12px 12px;padding:16px 32px;border:1px solid #2a2a2a;border-top:none}
.ft p{font-size:11px;color:#6b6b7b;margin:0}
</style></head><body><div class="w">
<div class="hd"><div class="ic">✦</div><div><div class="nm">SEO Swarm</div><div class="sb">SEO Platform</div></div></div>
<div class="bd">${content}</div>
<div class="ft"><p>Automated message from The Swarm SEO Platform. Do not reply.</p></div>
</div></body></html>`
}

// ─── 1. Admin — new client onboarded ────────────────────────
export async function sendClientOnboardedAdmin(p: {
  clientName: string; clientEmail: string; domain: string
  niche: string; keywordCount: number; schedule: string; publishUrl: string
}) {
  return send(ADMIN, `New client: ${p.clientName} (${p.domain})`, tmpl(`
    <h1>New client onboarded</h1>
    <p>A client completed onboarding. Their pipeline is now active.</p>
    <div class="card">
      <div class="kv"><span class="kl">Name: </span><span class="kv2">${p.clientName}</span></div>
      <div class="kv"><span class="kl">Email: </span><span class="kv2">${p.clientEmail}</span></div>
      <div class="kv"><span class="kl">Domain: </span><span class="kv2">${p.domain}</span></div>
      <div class="kv"><span class="kl">Niche: </span><span class="kv2">${p.niche}</span></div>
      <div class="kv"><span class="kl">Keywords queued: </span><span class="kv2">${p.keywordCount}</span></div>
      <div class="kv"><span class="kl">Schedule: </span><span class="kv2">${p.schedule}</span></div>
      <div class="kv"><span class="kl">Publish URL: </span><span class="kv2">${p.publishUrl}</span></div>
    </div>
    <a href="${SITE}/dashboard" class="btn">View Dashboard</a>
  `))
}

// ─── 2. Client — welcome email ───────────────────────────────
export async function sendWelcomeEmail(p: {
  clientName: string; clientEmail: string; domain: string
  keywordCount: number; publishUrl: string; schedule: string
}) {
  const first = p.clientName.split(' ')[0]
  return send(p.clientEmail, `Your pipeline is live — ${p.domain}`, tmpl(`
    <h1>Welcome, ${first}. Your pipeline is live.</h1>
    <p>Your content automation pipeline is configured and running.</p>
    <div class="card">
      <div class="kv"><span class="kl">Keywords queued: </span><span class="kv2">${p.keywordCount}</span></div>
      <div class="kv"><span class="kl">Publishing to: </span><span class="kv2">${p.publishUrl}</span></div>
      <div class="kv"><span class="kl">Schedule: </span><span class="kv2">${p.schedule}</span></div>
      <div class="kv"><span class="kl">First article ETA: </span><span class="kv2">~48 hours</span></div>
    </div>
    <p>Your AI agents are now working:</p>
    <p><span class="badge">1</span>&nbsp; Researching keywords via Google<br><br>
    <span class="badge">2</span>&nbsp; Writing articles with GPT-4o<br><br>
    <span class="badge">3</span>&nbsp; Running quality review<br><br>
    <span class="badge">4</span>&nbsp; Publishing on your schedule</p>
    <a href="${p.publishUrl}" class="btn">View Your Site →</a>
  `))
}

// ─── 3. Admin — article published ───────────────────────────
export async function sendArticlePublishedAdmin(p: {
  keyword: string; domain: string; articleUrl: string
  metaTitle: string; metaDescription: string; clientName: string
}) {
  return send(ADMIN, `Published: ${p.metaTitle || p.keyword} — ${p.domain}`, tmpl(`
    <h1>Article published</h1>
    <p>A new article went live on <span class="hl">${p.domain}</span>.</p>
    <div class="card">
      <div class="kv"><span class="kl">Client: </span><span class="kv2">${p.clientName}</span></div>
      <div class="kv"><span class="kl">Keyword: </span><span class="kv2">${p.keyword}</span></div>
      <div class="kv"><span class="kl">Title: </span><span class="kv2">${p.metaTitle}</span></div>
      <div class="kv"><span class="kl">Description: </span><span class="kv2">${p.metaDescription?.slice(0,120)}</span></div>
    </div>
    <a href="${p.articleUrl}" class="btn">View Article →</a>
  `))
}

// ─── 4. Client — article published ───────────────────────────
export async function sendArticlePublishedClient(p: {
  clientEmail: string; clientName: string; keyword: string
  articleUrl: string; metaTitle: string; domain: string
}) {
  const first = p.clientName.split(' ')[0]
  return send(p.clientEmail, `New article live: ${p.metaTitle || p.keyword}`, tmpl(`
    <h1>Your article is live, ${first}.</h1>
    <p>A new article targeting <span class="hl">${p.keyword}</span> has been published.</p>
    <div class="card">
      <div class="kv"><span class="kl">Title: </span><span class="kv2">${p.metaTitle}</span></div>
      <div class="kv"><span class="kl">Keyword: </span><span class="kv2">${p.keyword}</span></div>
      <div class="kv"><span class="kl">Domain: </span><span class="kv2">${p.domain}</span></div>
      <div class="kv"><span class="kl">Status: </span><span class="kv2">Published ✓</span></div>
    </div>
    <a href="${p.articleUrl}" class="btn">Read the Article →</a>
  `))
}