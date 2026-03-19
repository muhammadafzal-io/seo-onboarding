'use client'

import { useState, useRef, useEffect } from 'react'

type Step = { id: number; label: string; subtitle: string }

const STEPS: Step[] = [
  { id: 1, label: 'About You', subtitle: 'Tell us who you are' },
  { id: 2, label: 'Your Business', subtitle: 'Domain and market position' },
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

export default function OnboardingForm({
  action,
}: {
  action: (fd: FormData) => Promise<{ success: boolean; error?: string }>
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INIT)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
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
    setTimeout(() => { setStep(s => s + dir); setVisible(true) }, 200)
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink:     #0d0d0d;
          --ink-2:   #1c1c1c;
          --ink-3:   #3a3a3a;
          --muted:   #767676;
          --muted-2: #a0a0a0;
          --rule:    #e8e4de;
          --surface: #faf9f7;
          --warm:    #f2ede6;
          --card:    #ffffff;
          --accent:  #c4622d;
          --gold:    #b8976a;
          --sans:    'Instrument Sans', sans-serif;
          --serif:   'Fraunces', serif;
          --mono:    'DM Mono', monospace;
        }
        body { font-family: var(--sans); }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dotPulse { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        input, textarea {
          width: 100%;
          padding: 13px 16px;
          background: var(--card);
          border: 1.5px solid var(--rule);
          border-radius: 8px;
          font-size: 15px;
          color: var(--ink);
          outline: none;
          font-family: var(--sans);
          transition: border-color .15s, box-shadow .15s;
          resize: vertical;
        }
        input.err, textarea.err { border-color: #dc2626; }
        input:focus, textarea:focus {
          border-color: var(--ink) !important;
          box-shadow: 0 0 0 3px rgba(13,13,13,.07) !important;
        }
        input::placeholder, textarea::placeholder { color: var(--muted-2); }
        .chip {
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-family: var(--sans);
          cursor: pointer;
          border: 1.5px solid var(--rule);
          background: var(--card);
          color: var(--ink-3);
          transition: all .15s;
          font-weight: 400;
        }
        .chip:hover  { border-color: var(--ink); }
        .chip.active { background: var(--ink); color: #faf9f7; border-color: var(--ink); font-weight: 600; }
        .sched-btn {
          padding: 14px;
          border-radius: 8px;
          font-size: 14px;
          font-family: var(--sans);
          cursor: pointer;
          border: 1.5px solid var(--rule);
          background: var(--card);
          color: var(--ink-3);
          transition: all .15s;
          text-align: center;
          font-weight: 400;
        }
        .sched-btn:hover  { border-color: var(--ink); }
        .sched-btn.active { background: var(--ink); color: #faf9f7; border-color: var(--ink); font-weight: 600; }
        .btn-back { background:transparent; border:none; font-size:14px; color:var(--muted); cursor:pointer; font-family:var(--sans); font-weight:500; padding:12px 0; transition:color .15s; }
        .btn-back:hover { color: var(--ink); }
        .btn-next { background:var(--ink); color:#faf9f7; border:none; border-radius:8px; padding:13px 30px; font-size:14px; font-weight:600; cursor:pointer; font-family:var(--sans); transition:background .15s; display:flex; align-items:center; gap:6px; }
        .btn-next:hover { background: var(--ink-3); }
        .btn-next:disabled { opacity: 0.65; }
        .nav-dot-item:hover .nav-dot-label { color: var(--ink) !important; }
        @media (max-width: 768px) {
          .aside { display: none !important; }
          .main-inner { padding: 32px 20px !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--sans)' }}>

        {/* ── ASIDE ── */}
        <aside className="aside" style={{
          width: 360,
          flexShrink: 0,
          background: 'var(--warm)',
          borderRight: '1px solid var(--rule)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              The Brief
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              Setup
            </span>
          </div>

          {/* Intro copy */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
              Client Onboarding
            </p>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 300, lineHeight: 1.15, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 16 }}>
              Set up your<br /><em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>content pipeline.</em>
            </h2>
            <div style={{ width: 28, height: 1.5, background: 'var(--gold)', marginBottom: 16 }} />
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.75 }}>
              Complete each section to configure your publishing pipeline. Your preferences guide keyword selection, tone, and delivery.
            </p>
          </div>

          {/* Step nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {STEPS.map((s, i) => {
              const isActive = s.id === step
              const isComplete = s.id < step
              return (
                <div key={s.id} className="nav-dot-item" style={{ display: 'flex', flexDirection: 'column' }}>
                  {i > 0 && (
                    <div style={{
                      width: 1.5,
                      height: 24,
                      marginLeft: 10,
                      background: isComplete ? 'var(--ink)' : 'var(--rule)',
                      transition: 'background .3s',
                    }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Dot */}
                    <div style={{
                      width: 22, height: 22,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isComplete ? 'var(--ink)' : isActive ? 'var(--ink)' : 'transparent',
                      border: `1.5px solid ${isActive || isComplete ? 'var(--ink)' : 'var(--rule)'}`,
                      transition: 'all .25s',
                      transform: isActive ? 'scale(1.18)' : 'scale(1)',
                      marginTop: 2,
                    }}>
                      {isComplete && <span style={{ fontSize: 10, color: '#faf9f7', fontWeight: 700 }}>✓</span>}
                      {isActive && !isComplete && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#faf9f7', display: 'block' }} />}
                    </div>
                    {/* Label */}
                    <div>
                      <div className="nav-dot-label" style={{
                        fontSize: 14,
                        color: isActive ? 'var(--ink)' : isComplete ? 'var(--ink-3)' : 'var(--muted-2)',
                        fontWeight: isActive ? 600 : 400,
                        lineHeight: 1.3,
                        transition: 'all .2s',
                      }}>
                        {s.label}
                      </div>
                      {isActive && (
                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--gold)', marginTop: 3, letterSpacing: '0.02em' }}>
                          {s.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ paddingTop: 28, borderTop: '1px solid var(--rule)' }}>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--muted)',
              background: '#e8e2d9', padding: '4px 10px', borderRadius: 3,
              display: 'inline-block', marginBottom: 8,
            }}>
              Secure & Confidential
            </span>
            <p style={{ fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.55 }}>
              Your information is encrypted in transit and at rest.
            </p>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{
          flex: 1,
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          position: 'relative',
        }}>
          {/* Progress bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--rule)' }}>
            <div style={{ height: '100%', background: 'var(--ink)', width: `${progress}%`, transition: 'width .4s cubic-bezier(.22,1,.36,1)' }} />
          </div>

          <div className="main-inner" style={{ width: '100%', maxWidth: 520, padding: '60px 40px' }}>

            {/* Step header */}
            <div style={{
              marginBottom: 40,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : animDir === 'fwd' ? 'translateY(14px)' : 'translateY(-14px)',
              transition: 'opacity .2s ease, transform .2s ease',
            }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 12 }}>
                Step {step} of {STEPS.length}
              </p>
              <h1 style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(34px, 5vw, 48px)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                color: 'var(--ink)',
                lineHeight: 1.08,
                marginBottom: 10,
              }}>
                {STEPS[step - 1].label}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>
                {STEPS[step - 1].subtitle}
              </p>
            </div>

            {/* Fields */}
            <div style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : animDir === 'fwd' ? 'translateY(18px)' : 'translateY(-18px)',
              transition: 'opacity .2s ease, transform .2s ease',
            }}>

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>
                  <Field label="Full Name" required error={errors.name}>
                    <input
                      ref={firstRef as React.RefObject<HTMLInputElement>}
                      className={errors.name ? 'err' : ''}
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                    />
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                    <input
                      className={errors.email ? 'err' : ''}
                      placeholder="jane@yourcompany.com"
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>
                  <Field label="Website Domain" required error={errors.domain} hint="e.g. example.com — without https://">
                    <input
                      ref={firstRef as React.RefObject<HTMLInputElement>}
                      className={errors.domain ? 'err' : ''}
                      placeholder="example.com"
                      value={form.domain}
                      onChange={e => set('domain', e.target.value)}
                    />
                  </Field>
                  <Field label="Business Niche" required error={errors.niche} hint="e.g. SaaS, E-commerce, Legal Services">
                    <input
                      className={errors.niche ? 'err' : ''}
                      placeholder="e.g. Digital Marketing, Finance, Health & Wellness"
                      value={form.niche}
                      onChange={e => set('niche', e.target.value)}
                    />
                  </Field>
                  <Field label="Top Competitor URLs" required error={errors.competitors} hint="One URL per line">
                    <textarea
                      ref={firstRef as React.RefObject<HTMLTextAreaElement>}
                      className={errors.competitors ? 'err' : ''}
                      style={{ minHeight: 96, lineHeight: 1.65 }}
                      placeholder={'competitor1.com\ncompetitor2.com\ncompetitor3.com'}
                      value={form.competitors}
                      onChange={e => set('competitors', e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>
                  <Field label="Target Keywords" required error={errors.keywords} hint="Comma-separated — e.g. seo tools, content marketing, link building">
                    <textarea
                      ref={firstRef as React.RefObject<HTMLTextAreaElement>}
                      className={errors.keywords ? 'err' : ''}
                      style={{ minHeight: 96, lineHeight: 1.65 }}
                      placeholder="keyword one, keyword two, keyword three"
                      value={form.keywords}
                      onChange={e => set('keywords', e.target.value)}
                    />
                  </Field>
                  <Field label="Tone of Voice" required error={errors.tone} hint="How should your content read to your audience?">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                      {TONES.map(t => (
                        <button
                          key={t} type="button"
                          className={`chip${form.tone === t ? ' active' : ''}`}
                          onClick={() => set('tone', t)}
                        >{t}</button>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>
                  <Field label="Publishing Platform" hint="Where will your articles be published?">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                      {PLATFORMS.map(p => (
                        <button
                          key={p} type="button"
                          className={`chip${form.publish_platform === p ? ' active' : ''}`}
                          onClick={() => set('publish_platform', p)}
                        >{p}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Destination URL" required error={errors.publish_url} hint="The full URL where articles will be delivered">
                    <input
                      ref={firstRef as React.RefObject<HTMLInputElement>}
                      className={errors.publish_url ? 'err' : ''}
                      placeholder="https://yourwebsite.com/blog"
                      type="url"
                      value={form.publish_url}
                      onChange={e => set('publish_url', e.target.value)}
                    />
                  </Field>
                  <Field label="Publishing Frequency" required error={errors.schedule}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}>
                      {SCHEDULES.map(s => (
                        <button
                          key={s} type="button"
                          className={`sched-btn${form.schedule === s ? ' active' : ''}`}
                          onClick={() => set('schedule', s)}
                        >{s}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Additional Notes" hint="Optional — any special requirements or topics to avoid">
                    <textarea
                      style={{ minHeight: 80, lineHeight: 1.65 }}
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
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                fontSize: 13, color: '#dc2626',
                marginBottom: 24,
                fontFamily: 'var(--mono)',
              }}>
                ⚠ {apiError}
              </div>
            )}

            {/* Nav row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {step > 1
                ? <button type="button" className="btn-back" onClick={() => go(-1)}>← Back</button>
                : <div />
              }
              {step < STEPS.length
                ? <button type="button" className="btn-next" onClick={() => go(1)}>
                  Continue <span style={{ fontSize: 15 }}>→</span>
                </button>
                : <button
                  type="button" className="btn-next" onClick={submit} disabled={loading}
                  style={{ minWidth: 160, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? <Spinner /> : <>Submit <span style={{ fontSize: 15 }}>→</span></>}
                </button>
              }
            </div>
          </div>

          {/* Step dots */}
          <div style={{ position: 'absolute', bottom: 28, display: 'flex', gap: 6, alignItems: 'center' }}>
            {STEPS.map(s => (
              <div key={s.id} style={{
                height: 7,
                width: s.id === step ? 28 : 7,
                borderRadius: 100,
                background: s.id === step ? 'var(--ink)' : s.id < step ? 'var(--muted)' : 'var(--rule)',
                transition: 'all .3s ease',
              }} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

// ── Field wrapper ─────────────────────────────────────────────
function Field({
  label, required, error, hint, children,
}: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: 'var(--ink)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--sans)',
      }}>
        {label}
        {required && <span style={{ color: '#dc2626', fontSize: 11 }}>*</span>}
        {!required && (
          <span style={{
            fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted-2)',
            background: '#ede8e0', padding: '2px 8px', borderRadius: 3,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            optional
          </span>
        )}
      </label>
      {hint && (
        <p style={{ fontSize: 12, color: 'var(--muted-2)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', fontFamily: 'var(--mono)' }}>{error}</p>
      )}
    </div>
  )
}

// ── Loading spinner ───────────────────────────────────────────
function Spinner() {
  return (
    <span style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: '#faf9f7',
          display: 'inline-block',
          animation: `dotPulse 1s ${i * 0.15}s infinite`,
        }} />
      ))}
    </span>
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
        :root {
          --ink: #0d0d0d; --ink-3: #3a3a3a; --muted: #767676; --muted-2: #a0a0a0;
          --rule: #e8e4de; --surface: #faf9f7; --warm: #f2ede6;
          --gold: #b8976a; --accent: #c4622d;
          --sans: 'Instrument Sans', sans-serif;
          --serif: 'Fraunces', serif;
          --mono: 'DM Mono', monospace;
        }
        body { font-family: var(--sans); background: var(--surface); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ringPulse { 0% { transform:scale(.9); opacity:.7; } 70% { transform:scale(1.3); opacity:0; } 100% { transform:scale(1.3); opacity:0; } }
        .home-btn { padding:13px 28px; background:transparent; border:1.5px solid var(--ink); color:var(--ink); border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; font-family:var(--sans); transition:background .2s, color .2s; }
        .home-btn:hover { background:var(--ink); color:#faf9f7; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{
          maxWidth: 520, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, textAlign: 'center',
          animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both',
        }}>

          {/* Icon */}
          <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 8 }}>
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: '1.5px solid var(--gold)',
              animation: 'ringPulse 2s infinite',
            }} />
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1,
            }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 30, color: '#faf9f7' }}>✦</span>
            </div>
          </div>

          <h1 style={{
            fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 6vw, 54px)',
            fontWeight: 300, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1.1,
          }}>
            Welcome,<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{first}.</em>
          </h1>

          <div style={{ width: 36, height: 1.5, background: 'var(--gold)' }} />

          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, maxWidth: 420 }}>
            Your pipeline is live. We've queued{' '}
            <strong style={{ color: 'var(--ink)' }}>{count} keyword{count !== 1 ? 's' : ''}</strong>{' '}
            for research and will begin delivering content to{' '}
            <strong style={{ color: 'var(--ink)' }}>{publishUrl}</strong>.
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 40px',
            background: 'var(--warm)',
            borderRadius: 12,
            border: '1px solid var(--rule)',
            width: '100%', gap: 0,
          }}>
            {[
              { num: String(count), label: 'Keywords queued' },
              { num: '48h', label: 'First article ETA' },
              { num: '∞', label: 'Monthly capacity' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {i > 0 && <div style={{ width: 1, height: 44, background: 'var(--rule)', flexShrink: 0 }} />}
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5,
                }}>
                  <span style={{
                    fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 300,
                    color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.04em',
                  }}>
                    {item.num}
                  </span>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted-2)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'var(--muted-2)', fontFamily: 'var(--mono)', letterSpacing: '0.03em' }}>
            A confirmation has been sent to your email address.
          </p>

          <button className="home-btn" onClick={() => { window.location.href = '/' }}>
            ← Return to Home
          </button>
        </div>
      </div>
    </>
  )
}
