'use client'

import { useState, useEffect } from 'react'

// ─── Constants ────────────────────────────────────────────────
const TONES = ['Professional', 'Casual & Friendly', 'Technical', 'Conversational', 'Formal']
const SCHEDULES = ['Daily', 'Every 2 Days', 'Weekly', 'Bi-weekly']
const PLATFORMS = ['WordPress', 'Webflow', 'Ghost', 'Medium', 'Substack', 'Shopify', 'Custom / Other']
const CONTENT_TYPES = ['Blog Post', 'How-To Guide', 'Listicle', 'Landing Page', 'Case Study', 'Product Page']
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Urdu', 'Portuguese', 'Chinese']
const WORD_COUNTS = ['800', '1200', '1500', '2000', '2500', '3000']

const NAV_ITEMS = [
    { label: 'Dashboard', icon: '⊞', href: '/dashboard' },
    { label: 'Articles', icon: '◈', href: '/articles' },
    { label: 'Keywords', icon: '◇', href: '/keywords' },
    { label: 'Onboarding', icon: '✦', href: '#', active: true },
    { label: 'Settings', icon: '⚙', href: '/settings' },
]

type FormState = {
  name: string; email: string; domain: string; niche: string
  competitors: string; keywords: string; tone: string
    target_word_count: string; target_audience: string
    content_type: string; language: string
  publish_url: string; publish_platform: string; schedule: string; notes: string
}

const INIT: FormState = {
  name: '', email: '', domain: '', niche: '',
  competitors: '', keywords: '', tone: '',
    target_word_count: '1500', target_audience: '',
    content_type: 'Blog Post', language: 'English',
  publish_url: '', publish_platform: '', schedule: '', notes: '',
}

export default function OnboardingForm({
  action,
}: {
  action: (fd: FormData) => Promise<{ success: boolean; error?: string }>
    }) {
  const [form, setForm] = useState<FormState>(INIT)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeSection, setActiveSection] = useState('client')

  const set = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

    const kwCount = form.keywords.split(',').filter(k => k.trim()).length

  const validate = (): boolean => {
    const e: Partial<FormState> = {}
      if (!form.name.trim()) e.name = 'Required'
      if (!form.email.trim()) e.email = 'Required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
      if (!form.domain.trim()) e.domain = 'Required'
      if (!form.niche.trim()) e.niche = 'Required'
      if (!form.competitors.trim()) e.competitors = 'Required'
      if (!form.keywords.trim()) e.keywords = 'Required'
      if (!form.tone) e.tone = 'Select a tone'
      if (!form.publish_url.trim()) {
          e.publish_url = 'Required'
      } else {
          try { new URL(form.publish_url) } catch { e.publish_url = 'Invalid URL' }
      }
      if (!form.schedule) e.schedule = 'Select a frequency'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
      if (!validate()) {
          setApiError('Please fill in all required fields above.')
          return
      }
    setLoading(true); setApiError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const res = await action(fd)
    setLoading(false)
    if (res.success) setDone(true)
    else setApiError(res.error || 'Something went wrong. Please try again.')
  }

  if (done) return <SuccessScreen name={form.name} keywords={form.keywords} publishUrl={form.publish_url} />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink:      #ececec;
          --ink-2:    #d1d1d1;
          --ink-3:    #acacac;
          --muted:    #8e8ea0;
          --muted-2:  #6b6b7b;
          --rule:     #3f3f3f;
          --rule-2:   #2a2a2a;
          --surface:  #212121;
          --sidebar:  #171717;
          --card:     #2f2f2f;
          --warm:     #1e1e1e;
          --accent:   #10a37f;
          --gold:     #10a37f;
          --violet:   #10a37f;
          --violet-l: #0d2e26;
          --green:    #10a37f;
          --green-l:  #0d2e26;
          --cyan:     #10a37f;
          --cyan-l:   #0d2e26;
          --sans:     'Instrument Sans', sans-serif;
          --serif:    'Fraunces', serif;
          --mono:     'DM Mono', monospace;
        }
        body { font-family: var(--sans); background: var(--surface); color: var(--ink); }
        * { scrollbar-width: thin; scrollbar-color: #3f3f3f transparent; }

        /* Inputs */
        .inp {
          width: 100%; padding: 9px 12px;
          background: var(--card);
          border: 1px solid var(--rule);
          border-radius: 8px; font-size: 14px;
          color: var(--ink); outline: none;
          font-family: var(--sans);
          transition: border-color .15s, box-shadow .15s;
        }
        .inp:focus { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,.1); }
        .inp.err  { border-color: #dc2626; }
        .inp::placeholder { color: var(--muted-2); }
        textarea.inp { resize: vertical; line-height: 1.6; }
        select.inp { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; appearance: none; padding-right: 36px; }

        /* Chips */
        .chip { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-family: var(--sans); cursor: pointer; border: 1px solid #3f3f3f; background: #2f2f2f; color: #acacac; transition: all .12s; font-weight: 400; }
        .chip:hover  { border-color: #10a37f; color: #10a37f; background: #0d2e26; }
        .chip.on     { background: #10a37f; color: #fff; border-color: #10a37f; font-weight: 600; }

        /* Buttons */
        .btn-submit { width: 100%; padding: 13px; background: #10a37f; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: background .15s, transform .1s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-submit:hover:not(:disabled) { background: #0d8f6f; }
        .btn-submit:active:not(:disabled) { transform: scale(0.99); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Nav */
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 7px; font-size: 13.5px; font-weight: 500; color: #8e8ea0; cursor: pointer; text-decoration: none; transition: all .15s; }
        .nav-item:hover { background: #2a2a2a; color: #ececec; }
        .nav-item.active { background: #0d2e26; color: #10a37f; font-weight: 600; }

        /* Section cards */
        .section-card { background: #2f2f2f; border: 1px solid #3f3f3f; border-radius: 14px; padding: 28px; margin-bottom: 20px; }
        .section-card:target, .section-card.highlight { border-color: #10a37f; box-shadow: 0 0 0 3px rgba(16,163,127,.08); }

        /* Grid */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }

        /* Pulse dot */
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        .pulse { animation: pulse 2s infinite; }

        /* Mobile sidebar overlay */
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; }
        @media (max-width: 1024px) {
          .sidebar-overlay.open { display: block; }
          .sidebar-panel { transform: translateX(-100%); transition: transform .25s ease; }
          .sidebar-panel.open { transform: translateX(0); }
        }

        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dotBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
      `}</style>

          <div style={{ display: 'flex', minHeight: '100vh' }}>

              {/* ── MOBILE OVERLAY ── */}
              <div
                  className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
                  onClick={() => setSidebarOpen(false)}
              />

              {/* ── SIDEBAR ── */}
              <aside className={`sidebar-panel${sidebarOpen ? ' open' : ''}`} style={{
                  width: 240,
                  background: 'var(--sidebar)',
                  borderRight: '1px solid #2a2a2a',
          display: 'flex',
          flexDirection: 'column',
                  padding: '24px 16px',
                  position: 'fixed',
                  top: 0, left: 0, bottom: 0,
                  zIndex: 50,
          overflowY: 'auto',
        }}>
          {/* Logo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', marginBottom: 32 }}>
                      <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--violet)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: '#fff' }}>✦</span>
                      </div>
                      <div>
                          <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em' }}>The Brief</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>SEO PLATFORM</div>
                      </div>
          </div>

                  {/* Nav */}
                  <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 6 }}>
                          Menu
                      </div>
                      {NAV_ITEMS.map(item => (
                          <a key={item.label} href={item.href} className={`nav-item${item.active ? ' active' : ''}`}>
                              <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                              {item.label}
                              {item.active && (
                                  <span style={{
                                      marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--mono)',
                                      background: '#10a37f', color: '#fff',
                                      padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em',
                                  }}>
                                      NOW
                                  </span>
                              )}
                          </a>
                      ))}
                  </nav>

                  {/* Dashboard link */}
                  <a href="/dashboard" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 8px', borderRadius: 7,
                      fontSize: 13, color: 'var(--t2)',
                      textDecoration: 'none', marginBottom: 12,
                      transition: 'color .15s',
                  }}>
                      <span style={{ fontSize: 14 }}>⊞</span>
                      View Dashboard
                  </a>

                  {/* Sidebar footer */}
                  <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16, marginTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px' }}>
                          <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10a37f, #0d6e5a)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, color: '#fff', fontWeight: 600, flexShrink: 0,
                          }}>
                              {(form.name || 'U')[0].toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {form.name || 'New Client'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {form.email || 'Not set'}
                              </div>
                          </div>
                      </div>
                  </div>
              </aside>

              {/* ── MAIN AREA ── */}
              <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

                  {/* ── STICKY HEADER ── */}
                  <header style={{
                      background: 'rgba(33,33,33,0.95)',
                      backdropFilter: 'blur(16px)',
                      borderBottom: '1px solid #2a2a2a',
                      position: 'sticky', top: 0, zIndex: 30,
                      padding: '0 32px',
                      height: 60,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Mobile menu button */}
                          <button
                              onClick={() => setSidebarOpen(!sidebarOpen)}
                              style={{
                                  display: 'none', background: 'none', border: 'none',
                                  cursor: 'pointer', padding: 4, color: 'var(--muted)',
                                  fontSize: 18,
                              }}
                              className="mobile-menu-btn"
                          >
                              ☰
                          </button>
                          <div>
                              <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                                  Client Onboarding
                              </h1>
                              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                                  Set up your content automation pipeline
                              </p>
                          </div>
                      </div>

                      {/* Header right */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Status pill */}
                          <div style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '5px 12px',
                              background: kwCount > 0 ? 'var(--cyan-l)' : 'var(--rule-2)',
                              borderRadius: 6,
                              border: `1px solid ${kwCount > 0 ? '#a5f3fc' : 'var(--rule)'}`,
                          }}>
                              <span className="pulse" style={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  background: kwCount > 0 ? 'var(--cyan)' : 'var(--muted-2)',
                                  display: 'block',
                              }} />
                              <span style={{ fontSize: 12, fontWeight: 500, color: kwCount > 0 ? 'var(--cyan)' : 'var(--muted)', fontFamily: 'var(--mono)' }}>
                                  {kwCount > 0 ? `${kwCount} keyword${kwCount !== 1 ? 's' : ''} ready` : 'Draft'}
                              </span>
                          </div>

                          {/* Avatar */}
                          <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10a37f, #0d6e5a)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, color: '#fff', fontWeight: 600, cursor: 'pointer',
                          }}>
                              {(form.name || 'U')[0].toUpperCase()}
                          </div>
                      </div>
                  </header>

                  {/* ── CONTENT + SUMMARY ── */}
                  <div style={{ display: 'flex', flex: 1, gap: 0 }}>

                      {/* ── FORM CONTENT ── */}
                      <div style={{ flex: 1, padding: '32px 32px 80px', maxWidth: 800, overflowX: 'hidden' }}>

                          {/* Page heading */}
                          <div style={{ marginBottom: 28 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
                                      New Client Setup
                                  </h2>
                                  <span style={{
                                      fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted-2)',
                                      background: '#2a2a2a', border: '1px solid #3f3f3f',
                                      padding: '3px 8px', borderRadius: 5, letterSpacing: '0.06em',
                                  }}>
                                      4 sections
                                  </span>
                              </div>
                              <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                                  Fill in your details to configure the AI content pipeline. All fields marked * are required.
                              </p>
                          </div>

                          {/* ── SECTION 1 — CLIENT INFORMATION ── */}
                          <div className="section-card" id="client">
                              <SectionHeader
                                  number="01"
                                  title="Client Information"
                                  desc="Your identity and business details"
                                  icon="◈"
                              />
                              <div className="grid-2" style={{ marginTop: 20 }}>
                  <Field label="Full Name" required error={errors.name}>
                                      <input className={`inp${errors.name ? ' err' : ''}`} placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                                      <input className={`inp${errors.email ? ' err' : ''}`} type="email" placeholder="jane@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </Field>
                                  <Field label="Website Domain" required error={errors.domain} hint="Without https://">
                                      <input className={`inp${errors.domain ? ' err' : ''}`} placeholder="example.com" value={form.domain} onChange={e => set('domain', e.target.value)} />
                  </Field>
                                  <Field label="Business Niche" required error={errors.niche} hint="Industry or topic area">
                                      <input className={`inp${errors.niche ? ' err' : ''}`} placeholder="e.g. SaaS, Finance, Health" value={form.niche} onChange={e => set('niche', e.target.value)} />
                  </Field>
                              </div>
                              <div style={{ marginTop: 16 }}>
                                  <Field label="Competitor URLs" required error={errors.competitors} hint="One URL per line — used for competitive analysis">
                                      <textarea className={`inp${errors.competitors ? ' err' : ''}`} style={{ minHeight: 88 }} placeholder={'competitor1.com\ncompetitor2.com'} value={form.competitors} onChange={e => set('competitors', e.target.value)} />
                  </Field>
                </div>
                          </div>

                          {/* ── SECTION 2 — CONTENT STRATEGY ── */}
                          <div className="section-card" id="strategy">
                              <SectionHeader
                                  number="02"
                                  title="Content Strategy"
                                  desc="Keywords, tone, and article configuration"
                                  icon="◇"
                              />
                              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  <Field
                                      label="Target Keywords"
                                      required
                                      error={errors.keywords}
                                      hint={`Comma-separated — ${kwCount > 0 ? `${kwCount} keyword${kwCount !== 1 ? 's' : ''} detected` : 'e.g. seo tools, content marketing'}`}
                                  >
                    <textarea
                                          className={`inp${errors.keywords ? ' err' : ''}`}
                                          style={{ minHeight: 88 }}
                                          placeholder="keyword one, keyword two, keyword three..."
                      value={form.keywords}
                      onChange={e => set('keywords', e.target.value)}
                    />
                  </Field>

                                  <div className="grid-2">
                                      <Field label="Target Audience" hint="Who are you writing for?">
                                          <input className="inp" placeholder="e.g. Small business owners" value={form.target_audience} onChange={e => set('target_audience', e.target.value)} />
                                      </Field>
                                      <Field label="Article Language">
                                          <select className="inp" value={form.language} onChange={e => set('language', e.target.value)}>
                                              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                                          </select>
                                      </Field>
                                      <Field label="Content Type">
                                          <select className="inp" value={form.content_type} onChange={e => set('content_type', e.target.value)}>
                                              {CONTENT_TYPES.map(c => <option key={c}>{c}</option>)}
                                          </select>
                                      </Field>
                                      <Field label="Target Word Count">
                                          <select className="inp" value={form.target_word_count} onChange={e => set('target_word_count', e.target.value)}>
                                              {WORD_COUNTS.map(w => <option key={w} value={w}>{w} words</option>)}
                                          </select>
                                      </Field>
                                  </div>

                                  <Field label="Tone of Voice" required error={errors.tone} hint="How should your content read?">
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {TONES.map(t => (
                          <button key={t} type="button" className={`chip${form.tone === t ? ' on' : ''}`} onClick={() => set('tone', t)}>{t}</button>
                      ))}
                    </div>
                                      {errors.tone && <p style={{ fontSize: 12, color: '#f87171', fontFamily: 'var(--mono)', marginTop: 4 }}>{errors.tone}</p>}
                  </Field>
                </div>
                          </div>

                          {/* ── SECTION 3 — PUBLISHING ── */}
                          <div className="section-card" id="publishing">
                              <SectionHeader
                                  number="03"
                                  title="Publishing"
                                  desc="Where and how often to publish"
                                  icon="↗"
                              />
                              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  <Field label="Publishing Platform" hint="Where will articles be published?">
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {PLATFORMS.map(p => (
                          <button key={p} type="button" className={`chip${form.publish_platform === p ? ' on' : ''}`} onClick={() => set('publish_platform', p)}>{p}</button>
                      ))}
                    </div>
                  </Field>

                                  <Field label="Destination URL" required error={errors.publish_url} hint="Full URL where articles will be delivered">
                                      <input className={`inp${errors.publish_url ? ' err' : ''}`} type="url" placeholder="https://yourwebsite.com" value={form.publish_url} onChange={e => set('publish_url', e.target.value)} />
                  </Field>

                                  <Field label="Publishing Frequency" required error={errors.schedule} hint="How often should new articles be published?">
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 6 }}>
                      {SCHEDULES.map(s => (
                        <button
                          key={s} type="button"
                              className={`chip${form.schedule === s ? ' on' : ''}`}
                              style={{ padding: '10px 8px', textAlign: 'center', borderRadius: 8 }}
                          onClick={() => set('schedule', s)}
                        >{s}</button>
                      ))}
                    </div>
                                      {errors.schedule && <p style={{ fontSize: 12, color: '#f87171', fontFamily: 'var(--mono)', marginTop: 4 }}>{errors.schedule}</p>}
                  </Field>
                              </div>
                          </div>

                          {/* ── SECTION 4 — NOTES ── */}
                          <div className="section-card" id="notes">
                              <SectionHeader
                                  number="04"
                                  title="Additional Notes"
                                  desc="Optional context for better results"
                                  icon="✎"
                              />
                              <div style={{ marginTop: 20 }}>
                                  <Field label="Notes" hint="Topics to avoid, regional focus, special requirements">
                                      <textarea className="inp" style={{ minHeight: 100 }} placeholder="Target audience details, topics to exclude, regional focus, brand voice notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                  </Field>
                              </div>
                          </div>

                          {/* API Error */}
                          {apiError && (
                              <div style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '12px 16px',
                                  background: '#2a1515',
                                  border: '1px solid #5a2020',
                                  borderRadius: 10,
                                  fontSize: 13, color: '#f87171',
                                  marginBottom: 20,
                              }}>
                                  <span style={{ fontSize: 16 }}>⚠</span>
                                  <span style={{ fontFamily: 'var(--mono)' }}>{apiError}</span>
                              </div>
                          )}

                          {/* Submit */}
                          <button className="btn-submit" onClick={submit} disabled={loading}>
                              {loading ? (
                                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                      {[0, 1, 2].map(i => (
                                          <span key={i} style={{
                                              width: 5, height: 5, borderRadius: '50%', background: '#fff',
                                              animation: `dotBounce 1s ${i * 0.15}s infinite`,
                                          }} />
                                      ))}
                                  </span>
                              ) : (
                                  <>
                                      <span>✦</span>
                                      Start Content Automation
                                      <span>→</span>
                                  </>
                              )}
                          </button>
                      </div>

                      {/* ── RIGHT SUMMARY PANEL ── */}
                      <aside style={{
                          width: 280,
                          flexShrink: 0,
                          padding: '32px 24px 32px 0',
                          position: 'sticky',
                          top: 60,
                          height: 'calc(100vh - 60px)',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16,
                      }}>

                          {/* Pipeline summary */}
                          <div style={{
                              background: 'var(--card)',
                              border: '1px solid var(--rule)',
                              borderRadius: 14,
                              overflow: 'hidden',
                          }}>
                              {/* Summary header */}
                              <div style={{
                                  background: '#171717',
                                  padding: '16px 20px',
                              }}>
                                  <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                                      Pipeline Summary
                                  </p>
                                  <p style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 300, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                      {form.name || 'New Client'}
                                  </p>
                                  {form.domain && (
                                      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                                          {form.domain}
                                      </p>
                                  )}
                              </div>

                              {/* Summary rows */}
                              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                  {[
                                      { label: 'Keywords', value: kwCount > 0 ? `${kwCount} queued` : '—', ok: kwCount > 0 },
                                      { label: 'Niche', value: form.niche || '—', ok: !!form.niche },
                                      { label: 'Tone', value: form.tone || '—', ok: !!form.tone },
                                      { label: 'Content Type', value: form.content_type || '—', ok: true },
                                      { label: 'Word Count', value: form.target_word_count ? `~${form.target_word_count}` : '—', ok: true },
                                      { label: 'Language', value: form.language || '—', ok: true },
                                      { label: 'Platform', value: form.publish_platform || '—', ok: !!form.publish_platform },
                                      { label: 'Schedule', value: form.schedule || '—', ok: !!form.schedule },
                                  ].map(({ label, value, ok }) => (
                                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                          <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{label}</span>
                                          <span style={{
                                              fontSize: 12, fontWeight: 500,
                                              color: ok && value !== '—' ? '#ececec' : '#6b6b7b',
                                              textAlign: 'right',
                                              maxWidth: 130,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                          }}>
                                              {value}
                                          </span>
                                      </div>
                                  ))}
                              </div>

                              {/* Completeness bar */}
                              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--rule)' }}>
                                  {(() => {
                                      const filled = [form.name, form.email, form.domain, form.niche, form.competitors, form.keywords, form.tone, form.publish_url, form.schedule].filter(Boolean).length
                                      const pct = Math.round((filled / 9) * 100)
                                      return (
                                          <>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Completeness</span>
                                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#10a37f', fontFamily: 'var(--mono)' }}>{pct}%</span>
                                              </div>
                                              <div style={{ height: 4, background: '#3f3f3f', borderRadius: 4, overflow: 'hidden' }}>
                                                  <div style={{
                                                      height: '100%',
                                                      width: `${pct}%`,
                                                      background: '#10a37f',
                                                      borderRadius: 4,
                                                      transition: 'width .4s ease',
                                                  }} />
                                              </div>
                                          </>
                                      )
                                  })()}
                              </div>
                          </div>

                          {/* What happens next */}
                          <div style={{
                              background: '#0d2e26',
                              border: '1px solid #ddd6fe',
                              borderRadius: 12,
                              padding: '16px 18px',
                          }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: '#10a37f', marginBottom: 10, fontFamily: 'var(--mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                  What happens next
                              </p>
                              {[
                                  'Keywords researched via SerpApi',
                                  'Article written by GPT-4o',
                                  'AI quality review',
                                  'Image generated by DALL-E',
                                  'Published to your site',
                              ].map((step, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                                      <div style={{
                                          width: 18, height: 18, borderRadius: '50%',
                                          background: '#10a37f', color: '#fff',
                                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          marginTop: 1,
                                      }}>
                                          {i + 1}
                                      </div>
                                      <span style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{step}</span>
                                  </div>
                              ))}
                          </div>
                      </aside>
                  </div>
              </div>
      </div>
    </>
  )
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ number, title, desc, icon }: { number: string; title: string; desc: string; icon: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
            }}>
                <span style={{ color: '#10a37f' }}>{icon}</span>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h3>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                        {number}
                    </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{desc}</p>
            </div>
        </div>
    )
}

// ── Field ─────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }: {
    label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
              fontSize: 12, fontWeight: 600, color: 'var(--ink-2)',
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.02em',
      }}>
        {label}
              {required && <span style={{ color: '#f87171' }}>*</span>}
        {!required && (
          <span style={{
                      fontSize: 9, color: 'var(--muted-2)', fontFamily: 'var(--mono)',
                      background: 'var(--rule-2)', padding: '1px 6px', borderRadius: 3,
            letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>opt</span>
        )}
      </label>
          {hint && <p style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--mono)' }}>{hint}</p>}
      {children}
          {error && <p style={{ fontSize: 11, color: '#f87171', fontFamily: 'var(--mono)' }}>{error}</p>}
    </div>
  )
}

// ── Success screen ────────────────────────────────────────────
function SuccessScreen({ name, keywords, publishUrl }: { name: string; keywords: string; publishUrl: string }) {
  const count = keywords.split(',').filter(k => k.trim()).length
  const first = name.split(' ')[0]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Instrument Sans', sans-serif; background: #212121; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes ringPulse { 0% { transform:scale(.85); opacity:.8; } 70% { transform:scale(1.25); opacity:0; } 100% { opacity:0; } }
        .home-btn { padding:12px 28px; background:transparent; border:1.5px solid #10a37f; color:#10a37f; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; font-family:'Instrument Sans',sans-serif; transition:all .15s; }
        .home-btn:hover { background:#10a37f; color:#fff; }
      `}</style>

          <div style={{ minHeight: '100vh', background: '#212121', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
              <div style={{
                  maxWidth: 540, width: '100%',
                  background: '#2f2f2f', border: '1px solid #3f3f3f',
                  borderRadius: 20, overflow: 'hidden',
          animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both',
        }}>
                  {/* Top band */}
                  <div style={{ background: '#171717', padding: '40px 40px 36px', textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 20px' }}>
                          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #10a37f', animation: 'ringPulse 2s infinite' }} />
                          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0d2e26', border: '1px solid #10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                              <span style={{ fontSize: 26, color: '#fff' }}>✦</span>
                          </div>
                      </div>
                      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 300, color: '#ececec', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>
                          Welcome, <em style={{ fontStyle: 'italic', color: '#ddd6fe' }}>{first}.</em>
                      </h1>
                      <p style={{ fontSize: 14, color: '#8e8ea0', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                          Your pipeline is configured. {count} keyword{count !== 1 ? 's have' : ' has'} been queued for processing.
                      </p>
                  </div>

          {/* Stats */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #3f3f3f' }}>
                      {[
                          { num: String(count), label: 'Keywords' },
                          { num: '1', label: 'Article' },
                          { num: '48h', label: 'ETA' },
                      ].map((s, i) => (
                          <div key={i} style={{
                              flex: 1, padding: '20px 16px', textAlign: 'center',
                              borderRight: i < 2 ? '1px solid #3f3f3f' : 'none',
                          }}>
                              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 300, color: '#ececec', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.num}</div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
                          </div>
                      ))}
                  </div>

                  {/* Pipeline steps */}
                  <div style={{ padding: '24px 32px 28px', background: '#2f2f2f' }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8e8ea0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                          Pipeline activated
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                              ['Keyword research', 'SerpApi scanning now'],
                              ['Article writing', 'GPT-4o — ~15 min'],
                              ['Quality review', 'AI editor — ~20 min'],
                              ['Image generation', 'DALL-E 3 — ~5 min'],
                              ['Publishing', `→ ${publishUrl}`],
                          ].map(([step, detail], i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{
                                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                      background: i === 0 ? '#10a37f' : '#3f3f3f',
                                      border: `1px solid ${i === 0 ? '#10a37f' : '#3f3f3f'}`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 10, color: i === 0 ? '#fff' : '#9ca3af', fontWeight: 600,
                                  }}>
                                      {i === 0 ? '●' : `${i + 1}`}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                                      <span style={{ fontSize: 13, fontWeight: 500, color: i === 0 ? '#ececec' : '#8e8ea0' }}>{step}</span>
                                      <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono', monospace" }}>{detail}</span>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                          <button className="home-btn" onClick={() => { window.location.href = '/' }}>
                              ← Return to Home
                          </button>
                      </div>
                  </div>
        </div>
      </div>
    </>
  )
}
