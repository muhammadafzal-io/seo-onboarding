'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = { id: number; label: string; subtitle: string }

const STEPS: Step[] = [
  { id: 1, label: 'About You', subtitle: 'Tell us who you are' },
  { id: 2, label: 'Your Business', subtitle: 'Your domain and market position' },
  { id: 3, label: 'SEO Strategy', subtitle: 'Keywords and tone of voice' },
  { id: 4, label: 'Publishing', subtitle: 'Where your content will appear' },
]

type FormState = {
  name: string; email: string; domain: string; niche: string
  competitors: string; keywords: string; tone: string
  publish_url: string; publish_platform: string; schedule: string; notes: string
}

const INIT: FormState = {
  name: '', email: '', domain: '', niche: '',
  competitors: '', keywords: '', tone: '',
  publish_url: '', publish_platform: '', schedule: '', notes: '',
}

const TONES = ['Professional', 'Casual & Friendly', 'Technical', 'Conversational', 'Formal']
const SCHEDULES = ['Daily', 'Every 2 Days', 'Weekly', 'Bi-weekly']
const PLATFORMS = ['WordPress', 'Webflow', 'Ghost', 'Medium', 'Substack', 'Shopify', 'Custom / Other']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingForm({
  action,
}: {
  action: (fd: FormData) => Promise<{ success: boolean; error?: string }>
}) {
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState<FormState>(INIT)
  const [errors, setErrors]   = useState<Partial<FormState>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [apiError, setApiError] = useState('')
  const [animDir, setAnimDir] = useState<'fwd' | 'back'>('fwd')
  const [visible, setVisible] = useState(true)
  const firstRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => { setTimeout(() => firstRef.current?.focus(), 300) }, [step])

  const set = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = (): boolean => {
    const e: Partial<FormState> = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Full name is required'
      if (!form.email.trim()) e.email = 'Email address is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email'
    }
    if (step === 2) {
      if (!form.domain.trim()) e.domain = 'Website domain is required'
      if (!form.niche.trim()) e.niche = 'Business niche is required'
      if (!form.competitors.trim()) e.competitors = 'Please add at least one competitor'
    }
    if (step === 3) {
      if (!form.keywords.trim()) e.keywords = 'Please add at least one keyword'
      if (!form.tone) e.tone = 'Please select a tone'
    }
    if (step === 4) {
      if (!form.publish_url.trim()) {
        e.publish_url = 'Publishing URL is required'
      } else {
        try { new URL(form.publish_url) } catch {
          e.publish_url = 'Please enter a valid URL (e.g. https://yoursite.com)'
        }
      }
      if (!form.schedule) e.schedule = 'Please select a publishing frequency'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const go = (dir: 1 | -1) => {
    if (dir === 1 && !validate()) return
    setAnimDir(dir === 1 ? 'fwd' : 'back')
    setVisible(false)
    setTimeout(() => { setStep(s => s + dir); setVisible(true) }, 210)
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true); setApiError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const res = await action(fd)
    setLoading(false)
    if (res.success) setDone(true)
    else setApiError(res.error || 'Something went wrong. Please try again.')
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  if (done) return <SuccessScreen name={form.name} keywords={form.keywords} publishUrl={form.publish_url} />

  return (
    <div style={S.page}>
      <GlobalStyles />

      {/* ── Left Aside ── */}
      <aside style={S.aside}>
        <div style={S.asideLogo}>
          <span style={S.logoMark}>✦</span>
          <span style={S.logoText}>The Brief</span>
        </div>

        <div style={S.asideContent}>
          <p style={S.asideEye}>CLIENT ONBOARDING</p>
          <h1 style={S.asideTitle}>Set up your content strategy</h1>
          <div style={S.asideDivider} />
          <p style={S.asideDesc}>
            Complete each section to configure your publishing pipeline.
            Your preferences guide everything from keyword selection to
            content delivery.
          </p>
        </div>

        {/* Step nav */}
        <nav style={S.stepNav}>
          {STEPS.map((s, i) => {
            const isActive = s.id === step
            const isComplete = s.id < step
            return (
              <div key={s.id} style={S.navRow}>
                {/* Connector line above (except first) */}
                {i > 0 && (
                  <div style={{
                    ...S.navConnector,
                    background: s.id <= step ? '#1c1814' : '#d4cdc2',
                  }} />
                )}
                <div style={S.navItem}>
                  <div style={{
                    ...S.navDot,
                    background: isComplete ? '#1c1814' : isActive ? '#1c1814' : 'transparent',
                    border: `2px solid ${isActive || isComplete ? '#1c1814' : '#d4cdc2'}`,
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  }}>
                    {isComplete && <span style={S.navCheck}>✓</span>}
                  </div>
                  <div>
                    <div style={{
                      ...S.navLabel,
                      color: isActive ? '#1c1814' : isComplete ? '#1c1814' : '#a09890',
                      fontWeight: isActive ? 600 : 400,
                    }}>{s.label}</div>
                    {isActive && <div style={S.navSub}>{s.subtitle}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div style={S.asideFooter}>
          <div style={S.footerBadge}>Secure & Confidential</div>
          <p style={S.footerNote}>Your information is encrypted in transit and at rest.</p>
        </div>
      </aside>

      {/* ── Right Main ── */}
      <main style={S.main}>
        {/* Progress bar */}
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${progress}%` }} />
        </div>

        <div style={S.formWrap}>
          {/* Step header */}
          <div style={{
            ...S.stepHeader,
            opacity:   visible ? 1 : 0,
            transform: visible ? 'none' : animDir === 'fwd' ? 'translateY(14px)' : 'translateY(-14px)',
            transition: 'opacity .21s ease, transform .21s ease',
          }}>
            <p style={S.stepEye}>Step {step} of {STEPS.length}</p>
            <h2 style={S.stepTitle}>{STEPS[step - 1].label}</h2>
            <p style={S.stepSubtitle}>{STEPS[step - 1].subtitle}</p>
          </div>

          {/* Fields */}
          <div style={{
            opacity:   visible ? 1 : 0,
            transform: visible ? 'none' : animDir === 'fwd' ? 'translateY(18px)' : 'translateY(-18px)',
            transition: 'opacity .21s ease, transform .21s ease',
          }}>

            {step === 1 && (
              <div style={S.fields}>
                <Field label="Full Name" required error={errors.name}>
                  <input
                    ref={firstRef as React.RefObject<HTMLInputElement>}
                    style={inp(!!errors.name)}
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                </Field>
                <Field label="Email Address" required error={errors.email}>
                  <input
                    style={inp(!!errors.email)}
                    placeholder="jane@yourcompany.com"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div style={S.fields}>
                <Field label="Website Domain" required error={errors.domain} hint="e.g. example.com — without https://">
                  <input
                    ref={firstRef as React.RefObject<HTMLInputElement>}
                    style={inp(!!errors.domain)}
                    placeholder="example.com"
                    value={form.domain}
                    onChange={e => set('domain', e.target.value)}
                  />
                </Field>
                <Field label="Business Niche" required error={errors.niche} hint="e.g. Digital Marketing, Finance, Health & Wellness">
                  <input
                    style={inp(!!errors.niche)}
                    placeholder="e.g. SaaS, E-commerce, Legal Services"
                    value={form.niche}
                    onChange={e => set('niche', e.target.value)}
                  />
                </Field>
                <Field label="Top Competitor URLs" required error={errors.competitors} hint="One URL per line">
                  <textarea
                    ref={firstRef as React.RefObject<HTMLTextAreaElement>}
                    style={{ ...inp(!!errors.competitors), ...S.textarea }}
                    placeholder={'competitor1.com\ncompetitor2.com\ncompetitor3.com'}
                    value={form.competitors}
                    onChange={e => set('competitors', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div style={S.fields}>
                <Field label="Target Keywords" required error={errors.keywords} hint="Comma-separated — e.g. seo tools, content marketing, link building">
                  <textarea
                    ref={firstRef as React.RefObject<HTMLTextAreaElement>}
                    style={{ ...inp(!!errors.keywords), ...S.textarea }}
                    placeholder="keyword one, keyword two, keyword three"
                    value={form.keywords}
                    onChange={e => set('keywords', e.target.value)}
                  />
                </Field>
                <Field label="Tone of Voice" required error={errors.tone} hint="How should your content read to your audience?">
                  <div style={S.chipGrid}>
                    {TONES.map(t => (
                      <button
                        key={t} type="button"
                        onClick={() => set('tone', t)}
                        style={{
                          ...S.chip,
                          background: form.tone === t ? '#1c1814' : '#ffffff',
                          color: form.tone === t ? '#faf8f4' : '#3a3530',
                          border: form.tone === t ? '1.5px solid #1c1814' : '1.5px solid #e2dbd0',
                          fontWeight: form.tone === t ? 600 : 400,
                        }}
                      >{t}</button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {step === 4 && (
              <div style={S.fields}>
                <Field label="Publishing Platform" hint="Where will your articles be published?">
                  <div style={S.chipGrid}>
                    {PLATFORMS.map(p => (
                      <button
                        key={p} type="button"
                        onClick={() => set('publish_platform', p)}
                        style={{
                          ...S.chip,
                          background: form.publish_platform === p ? '#1c1814' : '#ffffff',
                          color: form.publish_platform === p ? '#faf8f4' : '#3a3530',
                          border: form.publish_platform === p ? '1.5px solid #1c1814' : '1.5px solid #e2dbd0',
                          fontWeight: form.publish_platform === p ? 600 : 400,
                        }}
                      >{p}</button>
                    ))}
                  </div>
                </Field>

                <Field label="Destination URL" required error={errors.publish_url} hint="The URL where articles will be delivered">
                  <input
                    ref={firstRef as React.RefObject<HTMLInputElement>}
                    style={inp(!!errors.publish_url)}
                    placeholder="https://yourwebsite.com/blog"
                    type="url"
                    value={form.publish_url}
                    onChange={e => set('publish_url', e.target.value)}
                  />
                </Field>

                <Field label="Publishing Frequency" required error={errors.schedule}>
                  <div style={S.scheduleGrid}>
                    {SCHEDULES.map(s => (
                      <button
                        key={s} type="button"
                        onClick={() => set('schedule', s)}
                        style={{
                          ...S.scheduleBtn,
                          background: form.schedule === s ? '#1c1814' : '#ffffff',
                          color: form.schedule === s ? '#faf8f4' : '#3a3530',
                          border: form.schedule === s ? '1.5px solid #1c1814' : '1.5px solid #e2dbd0',
                          fontWeight: form.schedule === s ? 600 : 400,
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </Field>

                <Field label="Additional Notes" hint="Optional — any special requirements or topics to avoid">
                  <textarea
                    style={{ ...inp(false), ...S.textarea }}
                    placeholder="Target audience details, topics to exclude, regional focus..."
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* API Error */}
          {apiError && (
            <div style={S.apiError}>
              <span>⚠</span> {apiError}
            </div>
          )}

          {/* Navigation */}
          <div style={S.navRow2}>
            {step > 1
              ? <button type="button" onClick={() => go(-1)} style={S.btnBack}>← Back</button>
              : <div />
            }
            {step < STEPS.length
              ? <button type="button" onClick={() => go(1)} style={S.btnNext}>Continue →</button>
              : <button
                type="button" onClick={submit} disabled={loading}
                style={{ ...S.btnNext, opacity: loading ? 0.7 : 1, minWidth: 160 }}
              >
                {loading ? <Dots /> : 'Submit →'}
              </button>
            }
          </div>
        </div>

        {/* Step dots */}
        <div style={S.dots}>
          {STEPS.map(s => (
            <div key={s.id} style={{
              ...S.dot,
              background: s.id === step ? '#1c1814' : s.id < step ? '#7a7168' : '#d4cdc2',
              width: s.id === step ? 28 : 8,
            }} />
          ))}
        </div>
      </main>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, required, error, hint, children,
}: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={S.fieldWrap}>
      <label style={S.fieldLabel}>
        {label}
        {required && <span style={S.star}>*</span>}
        {!required && <span style={S.optTag}>optional</span>}
      </label>
      {hint && <p style={S.hint}>{hint}</p>}
      {children}
      {error && <p style={S.errorMsg}>{error}</p>}
    </div>
  )
}

function Dots() {
  return (
    <span style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#faf8f4',
          animation: `dotBounce 1s ${i * 0.15}s infinite`,
        }} />
      ))}
    </span>
  )
}

function SuccessScreen({ name, keywords, publishUrl }: { name: string; keywords: string; publishUrl: string }) {
  const count = keywords.split(',').filter(k => k.trim()).length
  const first = name.split(' ')[0]

  return (
    <div style={{ ...S.page, background: '#faf8f4' }}>
      <GlobalStyles />
      <div style={S.successWrap}>
        <div style={S.successIconWrap}>
          <span style={S.successIconInner}>✦</span>
        </div>
        <h1 style={S.successTitle}>Welcome aboard, {first}.</h1>
        <div style={S.successDivider} />
        <p style={S.successDesc}>
          Your publishing pipeline is configured. We've queued{' '}
          <strong>{count} keyword{count !== 1 ? 's' : ''}</strong> for research and
          will begin delivering content to{' '}
          <strong style={{ color: '#1c1814' }}>{publishUrl}</strong> on your chosen schedule.
        </p>

        <div style={S.metaBox}>
          {[
            { num: String(count), label: 'Keywords queued' },
            { num: '48h', label: 'First article ETA' },
            { num: '∞', label: 'Monthly capacity' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {i > 0 && <div style={S.metaDivider} />}
              <div style={S.metaItem}>
                <span style={S.metaNum}>{item.num}</span>
                <span style={S.metaLabel}>{item.label}</span>
              </div>
            </div>
          ))}
        </div>

        <p style={S.emailNote}>A confirmation has been sent to your email address.</p>

        {/* Home redirect button */}
        <button
          style={S.homeBtn}
          onClick={() => { window.location.href = '/' }}
        >
          ← Return to Home
        </button>
      </div>
    </div>
  )
}

const CSS_CONTENT = [
  "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');",
  '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',
  '@keyframes dotBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }',
  '@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }',
  '@keyframes pulseRing { 0% { transform: scale(.85); opacity: .7; } 70% { transform: scale(1.15); opacity: 0; } 100% { transform: scale(1.15); opacity: 0; } }',
  'input:focus, textarea:focus, select:focus { border-color: #1c1814 !important; box-shadow: 0 0 0 3px rgba(28,24,20,.08) !important; outline: none; }',
  'input::placeholder, textarea::placeholder { color: #b5a48a; }',
  '.btn-back-hover:hover { color: #1c1814 !important; }',
  '.btn-next-hover:hover { background: #3a3530 !important; }',
  '.home-btn-hover:hover { background: #1c1814 !important; color: #faf8f4 !important; }',
  '.chip-hover:hover { border-color: #1c1814 !important; }',
].join('\n')

function GlobalStyles() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return <style dangerouslySetInnerHTML={{ __html: CSS_CONTENT }} />
}

// ─── Input helper ─────────────────────────────────────────────────────────────

const inp = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '13px 16px',
  background: '#ffffff',
  border: `1.5px solid ${hasError ? '#b91c1c' : '#e2dbd0'}`,
  borderRadius: 8,
  fontSize: 15,
  color: '#1c1814',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'border-color .15s ease, box-shadow .15s ease',
})

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', sans-serif",
  },

  /* Aside */
  aside: {
    width: 380,
    flexShrink: 0,
    background: '#f2ede6',
    borderRight: '1px solid #e2dbd0',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'hidden',
  },
  asideLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 52,
  },
  logoMark: { fontSize: 14, color: '#b5a48a' },
  logoText: {
    fontSize: 17,
    fontWeight: 600,
    color: '#1c1814',
    letterSpacing: '-0.2px',
    fontFamily: "'Playfair Display', serif",
  },
  asideContent: { marginBottom: 44 },
  asideEye: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: '#b5a48a',
    marginBottom: 16,
  },
  asideTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-1px',
    color: '#1c1814',
    marginBottom: 20,
  },
  asideDivider: {
    width: 36,
    height: 2,
    background: '#b5a48a',
    marginBottom: 20,
  },
  asideDesc: {
    fontSize: 14,
    color: '#7a7168',
    lineHeight: 1.75,
    fontWeight: 300,
  },

  /* Step nav */
  stepNav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  navRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  navConnector: {
    width: 2,
    height: 20,
    marginLeft: 10,
    transition: 'background .3s ease',
  },
  navItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  navDot: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all .25s ease',
    marginTop: 2,
  },
  navCheck: { fontSize: 11, color: '#faf8f4', fontWeight: 700 },
  navLabel: {
    fontSize: 14,
    lineHeight: 1.3,
    transition: 'all .2s ease',
    letterSpacing: '-0.1px',
  },
  navSub: {
    fontSize: 11,
    color: '#b5a48a',
    fontFamily: "'DM Mono', monospace",
    marginTop: 3,
    letterSpacing: '0.3px',
  },

  asideFooter: {
    marginTop: 'auto',
    paddingTop: 28,
    borderTop: '1px solid #e2dbd0',
  },
  footerBadge: {
    display: 'inline-block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#7a7168',
    background: '#e8e2d9',
    padding: '4px 10px',
    borderRadius: 4,
    marginBottom: 8,
  },
  footerNote: { fontSize: 12, color: '#a09890', lineHeight: 1.5 },

  /* Main */
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 32px 60px',
    minHeight: '100vh',
    background: '#faf8f4',
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    background: '#e8e2d9',
  },
  progressFill: {
    height: '100%',
    background: '#1c1814',
    transition: 'width .4s cubic-bezier(.22,1,.36,1)',
  },

  formWrap: { width: '100%', maxWidth: 500 },

  stepHeader: { marginBottom: 36 },
  stepEye: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: '#b5a48a',
    marginBottom: 12,
  },
  stepTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 38,
    fontWeight: 700,
    letterSpacing: '-1.2px',
    color: '#1c1814',
    lineHeight: 1.1,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#7a7168',
    fontWeight: 300,
  },

  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    marginBottom: 36,
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1c1814',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  star: { color: '#b91c1c', fontSize: 12 },
  optTag: {
    fontSize: 9,
    fontFamily: "'DM Mono', monospace",
    color: '#b5a48a',
    letterSpacing: '1px',
    background: '#ede8e0',
    padding: '2px 8px',
    borderRadius: 3,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 12,
    color: '#a09890',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.2px',
  },
  errorMsg: {
    fontSize: 12,
    color: '#b91c1c',
    fontFamily: "'DM Mono', monospace",
  },
  textarea: {
    resize: 'vertical',
    minHeight: 96,
    lineHeight: 1.65,
  },

  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    padding: '9px 18px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all .15s ease',
    letterSpacing: '-0.1px',
  },

  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  scheduleBtn: {
    padding: '14px 16px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all .15s ease',
    textAlign: 'center',
    letterSpacing: '-0.1px',
  },

  apiError: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: 24,
    fontFamily: "'DM Mono', monospace",
  },

  navRow2: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnBack: {
    background: 'transparent',
    border: 'none',
    fontSize: 14,
    color: '#a09890',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    padding: '12px 0',
    transition: 'color .15s',
  },
  btnNext: {
    background: '#1c1814',
    color: '#faf8f4',
    border: 'none',
    borderRadius: 8,
    padding: '13px 28px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '-0.1px',
    transition: 'background .15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  dots: {
    position: 'absolute',
    bottom: 32,
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 100,
    transition: 'all .3s ease',
  },

  /* Success */
  successWrap: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '60px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    gap: 20,
    animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both',
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#1c1814',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIconInner: { fontSize: 28, color: '#faf8f4' },
  successTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 44,
    fontWeight: 700,
    letterSpacing: '-1.5px',
    color: '#1c1814',
    lineHeight: 1.1,
  },
  successDivider: {
    width: 48,
    height: 2,
    background: '#b5a48a',
  },
  successDesc: {
    fontSize: 16,
    color: '#7a7168',
    lineHeight: 1.75,
    maxWidth: 420,
    fontWeight: 300,
  },
  metaBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 40px',
    background: '#f2ede6',
    borderRadius: 12,
    border: '1px solid #e2dbd0',
    width: '100%',
    gap: 0,
  },
  metaDivider: {
    width: 1,
    height: 44,
    background: '#e2dbd0',
    margin: '0 32px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  },
  metaNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    fontWeight: 700,
    color: '#1c1814',
    lineHeight: 1,
    letterSpacing: '-1px',
  },
  metaLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: '#a09890',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
  },
  emailNote: {
    fontSize: 13,
    color: '#a09890',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.3px',
  },
  homeBtn: {
    marginTop: 8,
    padding: '14px 32px',
    background: 'transparent',
    border: '1.5px solid #1c1814',
    color: '#1c1814',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '-0.1px',
    transition: 'background .2s, color .2s',
  },
}