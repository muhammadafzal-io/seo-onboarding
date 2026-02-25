'use client'

import { useState, useRef, useEffect } from 'react'

type Step = {
  id: number
  label: string
  fields: string[]
}

const STEPS: Step[] = [
  { id: 1, label: 'About You',      fields: ['name', 'email'] },
  { id: 2, label: 'Your Business',  fields: ['domain', 'niche', 'competitors'] },
  { id: 3, label: 'SEO Strategy',   fields: ['keywords', 'tone'] },
  { id: 4, label: 'Publishing',     fields: ['blog_id', 'schedule', 'notes'] },
]

type FormState = {
  name: string; email: string; domain: string; niche: string
  competitors: string; keywords: string; tone: string
  blog_id: string; schedule: string; notes: string
}

const INIT: FormState = {
  name: '', email: '', domain: '', niche: '',
  competitors: '', keywords: '', tone: '',
  blog_id: '', schedule: '', notes: '',
}

const TONES    = ['Professional', 'Casual & Friendly', 'Technical', 'Conversational', 'Formal']
const SCHEDULES = ['Daily', 'Every 2 Days', 'Weekly', 'Bi-weekly']

export default function OnboardingForm({ action }: { action: (fd: FormData) => Promise<{ success: boolean; error?: string; clientId?: number }> }) {
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState<FormState>(INIT)
  const [errors, setErrors]   = useState<Partial<FormState>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [apiError, setApiError] = useState('')
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward')
  const [visible, setVisible] = useState(true)
  const firstRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setTimeout(() => firstRef.current?.focus(), 350)
  }, [step])

  const set = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = (): boolean => {
    const e: Partial<FormState> = {}
    if (step === 1) {
      if (!form.name.trim())  e.name  = 'Name is required'
      if (!form.email.trim()) e.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    }
    if (step === 2) {
      if (!form.domain.trim())      e.domain      = 'Domain is required'
      if (!form.niche.trim())       e.niche       = 'Niche is required'
      if (!form.competitors.trim()) e.competitors = 'Add at least one competitor'
    }
    if (step === 3) {
      if (!form.keywords.trim()) e.keywords = 'Add at least one keyword'
      if (!form.tone)            e.tone     = 'Select a tone'
    }
    if (step === 4) {
      if (!form.blog_id.trim()) e.blog_id  = 'Blog ID is required'
      if (!form.schedule)       e.schedule = 'Select a schedule'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const go = (dir: 1 | -1) => {
    if (dir === 1 && !validate()) return
    setAnimDir(dir === 1 ? 'forward' : 'back')
    setVisible(false)
    setTimeout(() => {
      setStep(s => s + dir)
      setVisible(true)
    }, 220)
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const res = await action(fd)
    setLoading(false)
    if (res.success) setDone(true)
    else setApiError(res.error || 'Something went wrong. Please try again.')
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  if (done) return <SuccessScreen name={form.name} keywords={form.keywords} />

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <aside style={styles.aside}>
        <div style={styles.asideLogo}>
          <span style={styles.logoMark}>◆</span>
          <span style={styles.logoText}>SEO Agent</span>
        </div>

        <div style={styles.asideHeading}>
          <p style={styles.asideEye}>Client Onboarding</p>
          <h1 style={styles.asideTitle}>
            Automate your<br />
            <em style={styles.asideTitleItalic}>entire SEO<br />pipeline.</em>
          </h1>
          <p style={styles.asideDesc}>
            Fill in your details once — our AI agents handle keyword research,
            content writing, review, and publishing automatically.
          </p>
        </div>

        {/* Step list */}
        <nav style={styles.stepNav}>
          {STEPS.map(s => (
            <div key={s.id} style={styles.navItem}>
              <div style={{
                ...styles.navDot,
                background:   s.id < step ? '#18180f' : s.id === step ? '#18180f' : 'transparent',
                border:       s.id <= step ? '2px solid #18180f' : '2px solid #d0ccc4',
                transform:    s.id === step ? 'scale(1.15)' : 'scale(1)',
              }}>
                {s.id < step && <span style={styles.navCheck}>✓</span>}
              </div>
              <div style={styles.navLine(s.id, step)}>
                <span style={{
                  ...styles.navLabel,
                  color: s.id <= step ? '#18180f' : '#8a8680',
                  fontWeight: s.id === step ? 600 : 400,
                }}>{s.label}</span>
                <span style={styles.navNum}>{String(s.id).padStart(2, '0')}</span>
              </div>
            </div>
          ))}
        </nav>

        <div style={styles.asideFooter}>
          <div style={styles.footerTag}>Powered by AI Agents</div>
          <p style={styles.footerNote}>Your data is encrypted and secure.</p>
        </div>
      </aside>

      {/* Right panel */}
      <main style={styles.main}>
        {/* Progress bar */}
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>

        <div style={styles.formWrap}>
          {/* Step header */}
          <div style={{
            ...styles.stepHeader,
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : animDir === 'forward' ? 'translateY(16px)' : 'translateY(-16px)',
            transition: 'all 0.22s ease',
          }}>
            <p style={styles.stepEye}>Step {step} of {STEPS.length}</p>
            <h2 style={styles.stepTitle}>{STEPS[step - 1].label}</h2>
          </div>

          {/* Fields */}
          <div style={{
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : animDir === 'forward' ? 'translateY(20px)' : 'translateY(-20px)',
            transition: 'all 0.22s ease',
          }}>
            {step === 1 && (
              <div style={styles.fields}>
                <Field label="Full Name" required error={errors.name}>
                  <input
                    ref={firstRef as React.RefObject<HTMLInputElement>}
                    style={inputStyle(!!errors.name)}
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                </Field>
                <Field label="Email Address" required error={errors.email}>
                  <input
                    style={inputStyle(!!errors.email)}
                    placeholder="jane@company.com"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div style={styles.fields}>
                <Field label="Website Domain" required error={errors.domain} hint="e.g. example.com — no https://">
                  <input
                    ref={firstRef as React.RefObject<HTMLInputElement>}
                    style={inputStyle(!!errors.domain)}
                    placeholder="example.com"
                    value={form.domain}
                    onChange={e => set('domain', e.target.value)}
                  />
                </Field>
                <Field label="Business Niche" required error={errors.niche} hint="e.g. Digital Marketing, Finance, Health">
                  <input
                    style={inputStyle(!!errors.niche)}
                    placeholder="e.g. SaaS, E-commerce, Legal"
                    value={form.niche}
                    onChange={e => set('niche', e.target.value)}
                  />
                </Field>
                <Field label="Top Competitor URLs" required error={errors.competitors} hint="One per line">
                  <textarea
                    ref={firstRef as React.RefObject<HTMLTextAreaElement>}
                    style={{ ...inputStyle(!!errors.competitors), ...styles.textarea }}
                    placeholder={"competitor1.com\ncompetitor2.com\ncompetitor3.com"}
                    value={form.competitors}
                    onChange={e => set('competitors', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div style={styles.fields}>
                <Field label="Target Keywords" required error={errors.keywords} hint="Comma separated — e.g. seo tools, content marketing">
                  <textarea
                    ref={firstRef as React.RefObject<HTMLTextAreaElement>}
                    style={{ ...inputStyle(!!errors.keywords), ...styles.textarea }}
                    placeholder="keyword one, keyword two, keyword three"
                    value={form.keywords}
                    onChange={e => set('keywords', e.target.value)}
                  />
                </Field>
                <Field label="Tone of Voice" required error={errors.tone}>
                  <div style={styles.toneGrid}>
                    {TONES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('tone', t)}
                        style={{
                          ...styles.toneBtn,
                          background:   form.tone === t ? '#18180f' : '#ffffff',
                          color:        form.tone === t ? '#f9f8f6' : '#3a3830',
                          border:       form.tone === t ? '1.5px solid #18180f' : '1.5px solid #e4e1db',
                          fontWeight:   form.tone === t ? 600 : 400,
                        }}
                      >{t}</button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {step === 4 && (
              <div style={styles.fields}>
                <Field label="Blogger Blog ID" required error={errors.blog_id} hint="Found in Blogger dashboard URL after /blog/posts/">
                  <input
                    ref={firstRef as React.RefObject<HTMLInputElement>}
                    style={inputStyle(!!errors.blog_id)}
                    placeholder="e.g. 4430789319492001627"
                    value={form.blog_id}
                    onChange={e => set('blog_id', e.target.value)}
                  />
                </Field>
                <Field label="Publishing Frequency" required error={errors.schedule}>
                  <div style={styles.scheduleGrid}>
                    {SCHEDULES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('schedule', s)}
                        style={{
                          ...styles.scheduleBtn,
                          background: form.schedule === s ? '#18180f' : '#ffffff',
                          color:      form.schedule === s ? '#f9f8f6' : '#3a3830',
                          border:     form.schedule === s ? '1.5px solid #18180f' : '1.5px solid #e4e1db',
                          fontWeight: form.schedule === s ? 600 : 400,
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Additional Notes" hint="Optional — anything else we should know">
                  <textarea
                    style={{ ...inputStyle(false), ...styles.textarea }}
                    placeholder="Any specific requirements, topics to avoid, target audience details..."
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <div style={styles.apiError}>
              <span style={{ fontSize: 14 }}>⚠</span> {apiError}
            </div>
          )}

          {/* Navigation */}
          <div style={styles.nav}>
            {step > 1 ? (
              <button type="button" onClick={() => go(-1)} style={styles.btnBack}>
                ← Back
              </button>
            ) : <div />}

            {step < STEPS.length ? (
              <button type="button" onClick={() => go(1)} style={styles.btnNext}>
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                style={{ ...styles.btnNext, opacity: loading ? 0.7 : 1, minWidth: 160 }}
              >
                {loading ? <LoadingDots /> : 'Submit →'}
              </button>
            )}
          </div>
        </div>

        {/* Bottom counter */}
        <div style={styles.counter}>
          {STEPS.map(s => (
            <div key={s.id} style={{
              ...styles.counterDot,
              background: s.id === step ? '#18180f' : s.id < step ? '#8a8680' : '#d0ccc4',
              width: s.id === step ? 24 : 8,
            }} />
          ))}
        </div>
      </main>
    </div>
  )
}

/* ── Sub-components ── */

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.star}>*</span>}
        {!required && <span style={styles.opt}>optional</span>}
      </label>
      {hint && <p style={styles.hint}>{hint}</p>}
      {children}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  )
}

function LoadingDots() {
  return (
    <span style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#f9f8f6',
          animation: `bounce 1s ${i * 0.15}s infinite`,
        }} />
      ))}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </span>
  )
}

function SuccessScreen({ name, keywords }: { name: string; keywords: string }) {
  const count = keywords.split(',').filter(k => k.trim()).length
  return (
    <div style={{ ...styles.page, background: '#f9f8f6' }}>
      <div style={styles.successWrap}>
        <div style={styles.successIcon}>◆</div>
        <h1 style={styles.successTitle}>You're all set, {name.split(' ')[0]}.</h1>
        <p style={styles.successDesc}>
          Your onboarding is complete. We've seeded <strong>{count} keyword{count !== 1 ? 's' : ''}</strong> into
          your pipeline. Our AI agents will begin researching and writing articles shortly.
        </p>
        <div style={styles.successMeta}>
          <div style={styles.metaItem}>
            <span style={styles.metaNum}>{count}</span>
            <span style={styles.metaLabel}>Keywords seeded</span>
          </div>
          <div style={styles.metaDiv} />
          <div style={styles.metaItem}>
            <span style={styles.metaNum}>4</span>
            <span style={styles.metaLabel}>AI agents active</span>
          </div>
          <div style={styles.metaDiv} />
          <div style={styles.metaItem}>
            <span style={styles.metaNum}>∞</span>
            <span style={styles.metaLabel}>Articles/month</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8a8680', fontFamily: "'Geist Mono', monospace" }}>
          Check your email for confirmation.
        </p>
      </div>
    </div>
  )
}

/* ── Styles ── */
const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '13px 16px',
  background: '#ffffff',
  border: `1.5px solid ${hasError ? '#c94040' : '#e4e1db'}`,
  borderRadius: 8,
  fontSize: 15,
  color: '#18180f',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
})

const styles: Record<string, React.CSSProperties | any> = {
  page: {
    display: 'flex',
    minHeight: '100vh',
  } as React.CSSProperties,

  /* ─ Aside ─ */
  aside: {
    width: 380,
    flexShrink: 0,
    background: '#f2f0ec',
    borderRight: '1px solid #e4e1db',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
    overflow: 'hidden',
  } as React.CSSProperties,

  asideLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 56,
  } as React.CSSProperties,

  logoMark: {
    fontSize: 18,
    color: '#18180f',
  } as React.CSSProperties,

  logoText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#18180f',
    letterSpacing: '-0.3px',
  } as React.CSSProperties,

  asideHeading: {
    marginBottom: 48,
  } as React.CSSProperties,

  asideEye: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 11,
    letterSpacing: '2.5px',
    textTransform: 'uppercase' as const,
    color: '#8a8680',
    marginBottom: 16,
  } as React.CSSProperties,

  asideTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 38,
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: '-1px',
    color: '#18180f',
    marginBottom: 16,
  } as React.CSSProperties,

  asideTitleItalic: {
    fontStyle: 'italic',
    color: '#18180f',
  } as React.CSSProperties,

  asideDesc: {
    fontSize: 14,
    color: '#6b6760',
    lineHeight: 1.7,
    fontWeight: 400,
  } as React.CSSProperties,

  /* ─ Step nav ─ */
  stepNav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    flex: 1,
  } as React.CSSProperties,

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  } as React.CSSProperties,

  navDot: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
  } as React.CSSProperties,

  navCheck: {
    fontSize: 11,
    color: '#f9f8f6',
    fontWeight: 700,
  } as React.CSSProperties,

  navLine: (id: number, current: number) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingBottom: id < 4 ? 20 : 0,
    borderLeft: id < 4 ? (id < current ? '1px solid #18180f' : '1px solid #d0ccc4') : 'none',
    paddingLeft: 14,
    marginLeft: -14,
    marginTop: id === 1 ? 0 : -20,
  }),

  navLabel: {
    fontSize: 14,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,

  navNum: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 11,
    color: '#c0bdb8',
  } as React.CSSProperties,

  asideFooter: {
    marginTop: 'auto',
    paddingTop: 32,
    borderTop: '1px solid #e4e1db',
  } as React.CSSProperties,

  footerTag: {
    display: 'inline-block',
    fontFamily: "'Geist Mono', monospace",
    fontSize: 10,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    color: '#8a8680',
    background: '#e8e5e0',
    padding: '4px 10px',
    borderRadius: 4,
    marginBottom: 8,
  } as React.CSSProperties,

  footerNote: {
    fontSize: 12,
    color: '#aaa9a5',
  } as React.CSSProperties,

  /* ─ Main ─ */
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    minHeight: '100vh',
    position: 'relative' as const,
  } as React.CSSProperties,

  progressWrap: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: '#e4e1db',
  } as React.CSSProperties,

  progressFill: {
    height: '100%',
    background: '#18180f',
    transition: 'width 0.4s ease',
  } as React.CSSProperties,

  formWrap: {
    width: '100%',
    maxWidth: 520,
  } as React.CSSProperties,

  stepHeader: {
    marginBottom: 40,
  } as React.CSSProperties,

  stepEye: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 11,
    letterSpacing: '2.5px',
    textTransform: 'uppercase' as const,
    color: '#8a8680',
    marginBottom: 12,
  } as React.CSSProperties,

  stepTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 36,
    fontWeight: 400,
    letterSpacing: '-1px',
    color: '#18180f',
    lineHeight: 1.1,
  } as React.CSSProperties,

  fields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 28,
    marginBottom: 40,
  } as React.CSSProperties,

  fieldWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#18180f',
    letterSpacing: '-0.1px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,

  star: {
    color: '#c94040',
    fontSize: 12,
  } as React.CSSProperties,

  opt: {
    fontSize: 10,
    fontFamily: "'Geist Mono', monospace",
    color: '#aaa',
    letterSpacing: '0.5px',
    background: '#f2f0ec',
    padding: '2px 7px',
    borderRadius: 4,
  } as React.CSSProperties,

  hint: {
    fontSize: 12,
    color: '#8a8680',
    marginTop: -4,
    fontFamily: "'Geist Mono', monospace",
  } as React.CSSProperties,

  error: {
    fontSize: 12,
    color: '#c94040',
    fontFamily: "'Geist Mono', monospace",
  } as React.CSSProperties,

  textarea: {
    resize: 'vertical' as const,
    minHeight: 100,
    lineHeight: 1.6,
  } as React.CSSProperties,

  toneGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  } as React.CSSProperties,

  toneBtn: {
    padding: '9px 18px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s ease',
    letterSpacing: '-0.1px',
  } as React.CSSProperties,

  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  } as React.CSSProperties,

  scheduleBtn: {
    padding: '14px 16px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s ease',
    textAlign: 'center' as const,
    letterSpacing: '-0.1px',
  } as React.CSSProperties,

  apiError: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 13,
    color: '#c94040',
    marginBottom: 24,
    fontFamily: "'Geist Mono', monospace",
  } as React.CSSProperties,

  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  btnBack: {
    background: 'transparent',
    border: 'none',
    fontSize: 14,
    color: '#8a8680',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    padding: '12px 0',
    transition: 'color 0.15s',
  } as React.CSSProperties,

  btnNext: {
    background: '#18180f',
    color: '#f9f8f6',
    border: 'none',
    borderRadius: 8,
    padding: '13px 28px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '-0.2px',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  } as React.CSSProperties,

  counter: {
    position: 'absolute' as const,
    bottom: 32,
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  } as React.CSSProperties,

  counterDot: {
    height: 8,
    borderRadius: 100,
    transition: 'all 0.3s ease',
  } as React.CSSProperties,

  /* ─ Success ─ */
  successWrap: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center' as const,
    gap: 24,
  } as React.CSSProperties,

  successIcon: {
    fontSize: 32,
    color: '#18180f',
    marginBottom: 8,
    animation: 'spin 1s ease both',
  } as React.CSSProperties,

  successTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 44,
    fontWeight: 400,
    letterSpacing: '-1.5px',
    color: '#18180f',
    lineHeight: 1.1,
  } as React.CSSProperties,

  successDesc: {
    fontSize: 16,
    color: '#6b6760',
    lineHeight: 1.7,
    maxWidth: 420,
  } as React.CSSProperties,

  successMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 32,
    padding: '24px 40px',
    background: '#f2f0ec',
    borderRadius: 12,
    border: '1px solid #e4e1db',
    width: '100%',
    justifyContent: 'center',
  } as React.CSSProperties,

  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,

  metaNum: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 32,
    color: '#18180f',
    lineHeight: 1,
  } as React.CSSProperties,

  metaLabel: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 10,
    color: '#8a8680',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  metaDiv: {
    width: 1,
    height: 40,
    background: '#e4e1db',
  } as React.CSSProperties,
}
