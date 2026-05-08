'use client'

import { useState } from 'react'
import Layout from '../../components/Layout'


// ─── Constants ────────────────────────────────────────────────
const TONES = ['Professional', 'Casual & Friendly', 'Technical', 'Conversational', 'Formal']
const SCHEDULES = ['Daily', 'Every 2 Days', 'Weekly', 'Bi-weekly']
const PLATFORMS = ['WordPress', 'Webflow', 'Ghost', 'Medium', 'Substack', 'Shopify', 'Custom / Other']
const CONTENT_TYPES = ['Blog Post', 'How-To Guide', 'Listicle', 'Landing Page', 'Case Study', 'Product Page']
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Urdu', 'Portuguese', 'Chinese']
const WORD_COUNTS = ['800', '1200', '1500', '2000', '2500', '3000']

// ✅ REMOVED: NAV_ITEMS constant as it is now handled by the main Sidebar

type FormState = {
    name: string; email: string; domain: string; niche: string
    competitors: string; keywords: string; tone: string
    target_word_count: string; target_audience: string
    content_type: string; language: string
    publish_url: string; publish_platform: string; schedule: string; notes: string
    ga_property_id: string;
}

const INIT: FormState = {
    name: '', email: '', domain: '', niche: '',
    competitors: '', keywords: '', tone: '',
    target_word_count: '1500', target_audience: '',
    content_type: 'Blog Post', language: 'English',
    publish_url: '', publish_platform: '', schedule: '',
    notes: '', ga_property_id: '',
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
        <Layout title="Client Onboarding">
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --ink:      #ececec; --ink-2:    #d1d1d1; --ink-3:    #acacac;
          --muted:    #8e8ea0; --muted-2:  #6b6b7b; --rule:     #3f3f3f;
          --rule-2:   #2a2a2a; --surface:  #212121; --sidebar:  #171717;
          --card:     #2f2f2f; --warm:     #1e1e1e; --accent:   #10a37f;
          --gold:     #10a37f; --violet:   #10a37f; --violet-l: #0d2e26;
          --sans:     'Instrument Sans', sans-serif; --serif: 'Fraunces', serif; --mono: 'DM Mono', monospace;
        }
        .inp { width: 100%; padding: 9px 12px; background: var(--card); border: 1px solid var(--rule); border-radius: 8px; font-size: 14px; color: var(--ink); outline: none; font-family: var(--sans); transition: border-color .15s, box-shadow .15s; }
        .inp:focus { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,.1); }
        .inp.err  { border-color: #dc2626; }
        .inp::placeholder { color: var(--muted-2); }
        textarea.inp { resize: vertical; line-height: 1.6; }
        select.inp { cursor: pointer; appearance: none; padding-right: 36px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; }
        .chip { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-family: var(--sans); cursor: pointer; border: 1px solid #3f3f3f; background: #2f2f2f; color: #acacac; transition: all .12s; }
        .chip:hover  { border-color: #10a37f; color: #10a37f; background: #0d2e26; }
        .chip.on     { background: #10a37f; color: #fff; border-color: #10a37f; font-weight: 600; }
        .btn-submit { width: 100%; padding: 13px; background: #10a37f; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .section-card { background: #2f2f2f; border: 1px solid #3f3f3f; border-radius: 14px; padding: 28px; margin-bottom: 20px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes dotBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }

        
        @media (max-width: 1024px) {
          .layout-container { flex-direction: column !important; gap: 24px !important; }
          .summary-sidebar { width: 100% !important; padding: 0 !important; position: static !important; }
          .form-content { max-width: 100% !important; }
        }
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-4-responsive { grid-template-columns: repeat(2, 1fr) !important; }
          .responsive-header { padding: 12px 16px !important; margin: 0 -16px 20px !important; flex-wrap: wrap !important; gap: 12px !important; }
          .section-card { padding: 20px !important; }
        }
        @media (max-width: 480px) {
          .grid-4-responsive { grid-template-columns: 1fr !important; }
          .responsive-header { margin: 0 -12px 20px !important; border-radius: 0 !important; }
        }
      ` }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>


                <header className="responsive-header" style={{ background: 'rgba(33,33,33,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #2a2a2a', position: 'sticky', top: -24, zIndex: 30, margin: '0 -24px 24px', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Client Onboarding</h1>
                        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Set up content automation pipeline</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: kwCount > 0 ? '#0d2e26' : '#2a2a2a', borderRadius: 6, border: `1px solid ${kwCount > 0 ? '#10a37f' : '#3f3f3f'}` }}>
                            <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: kwCount > 0 ? '#10a37f' : '#6b6b7b', display: 'block' }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: kwCount > 0 ? '#10a37f' : '#8e8ea0', fontFamily: 'var(--mono)' }}>
                                {kwCount > 0 ? `${kwCount} keywords ready` : 'Draft'}
                            </span>
                        </div>
                    </div>
                </header>


                <div className="layout-container" style={{ display: 'flex', gap: 0 }}>
                    {/* ── FORM CONTENT ── */}

                    <div className="form-content" style={{ flex: 1, maxWidth: 800 }}>
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.025em' }}>New Client Setup</h2>
                            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Fill in details to configure AI content pipeline. All fields marked * are required.</p>
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
                                <Field
                                    label="GA4 Property ID"
                                    hint="9-digit ID (e.g., 456829103) found in GA4 Property Settings."
                                >
                                    <input
                                        className="inp"
                                        placeholder="123456789"
                                        value={form.ga_property_id}
                                        onChange={e => set('ga_property_id', e.target.value.replace(/\D/g, ''))}
                                    />
                                </Field>

                                <Field label="Publishing Frequency" required error={errors.schedule} hint="How often should new articles be published?">
                                    {/* Added grid-4-responsive class */}
                                    <div className="grid-4-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 6 }}>
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

                        {apiError && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#2a1515', border: '1px solid #5a2020', borderRadius: 10, fontSize: 13, color: '#f87171', marginBottom: 20 }}><span style={{ fontSize: 16 }}>⚠</span><span>{apiError}</span></div>}

                        <button className="btn-submit" onClick={submit} disabled={loading}>
                            {loading ? <span style={{ display: 'flex', gap: 4 }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: `dotBounce 1s ${i * 0.15}s infinite` }} />)}</span> : <><span>✦</span>Start Content Automation<span>→</span></>}
                        </button>
                    </div>

                    {/* ── RIGHT SUMMARY PANEL ── */}

                    <aside className="summary-sidebar" style={{ width: 280, flexShrink: 0, padding: '0 0 0 24px', position: 'sticky', top: 180, height: 'fit-content' }}>
                        <div style={{ background: 'var(--card)', border: '1px solid var(--rule)', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ background: '#171717', padding: '16px 20px' }}>
                                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Pipeline Summary</p>
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 20, color: '#fff' }}>{form.name || 'New Client'}</p>
                            </div>
                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[{ label: 'Keywords', value: kwCount > 0 ? `${kwCount} queued` : '—' }, { label: 'Niche', value: form.niche || '—' }, { label: 'Tone', value: form.tone || '—' }, { label: 'Frequency', value: form.schedule || '—' }].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                        <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', flex: 1 }}>{row.label}</span>
                                        <span style={{ color: '#ececec', fontWeight: 500 }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            background: '#0d2e26',
                            border: '1px solid #10a37f', // Changed from #ddd6fe to match theme
                            borderRadius: 12,
                            padding: '16px 18px',
                            marginTop: '20px' // Slightly adjusted for better mobile spacing
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
        </Layout>
    )
}

// ── SUPPORTING COMPONENTS ─────────────────────────────────────

function SectionHeader({ number, title, desc, icon }: { number: string; title: string; desc: string; icon: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0d2e26', border: '1px solid #10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                <span style={{ color: '#10a37f' }}>{icon}</span>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{title}</h3>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted-2)' }}>{number}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{desc}</p>
            </div>
        </div>
    )
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {label} {required && <span style={{ color: '#f87171' }}>*</span>}
            </label>
            {hint && <p style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--mono)', margin: 0 }}>{hint}</p>}
            {children}
            {error && <p style={{ fontSize: 11, color: '#f87171', fontFamily: 'var(--mono)', margin: 0 }}>{error}</p>}
        </div>
    )
}

function SuccessScreen({ name, keywords, publishUrl }: { name: string; keywords: string; publishUrl: string }) {
    const SERVICE_EMAIL = "kaltech@seo-swarm.iam.gserviceaccount.com"; // YOUR ACTUAL EMAIL
    const [copied, setCopied] = useState(false);

    const copyEmail = () => {
        navigator.clipboard.writeText(SERVICE_EMAIL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Layout title="Next Steps">
            <div style={{ padding: '40px 24px', maxWidth: 640, margin: '0 auto' }}>
                <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 20, padding: 40, textAlign: 'center' }}>
                    <h1 style={{ fontSize: 32, fontWeight: 300, color: '#ececec', marginBottom: 8 }}>Onboarding Complete!</h1>
                    <p style={{ color: '#8e8ea0', marginBottom: 32 }}>Your AI pipeline is active. To enable **Live Analytics** on your dashboard, please complete this final step:</p>

                    {/* Integration Box */}
                    <div style={{ background: '#171717', borderRadius: 12, padding: 24, textAlign: 'left', border: '1px solid #10a37f' }}>
                        <p style={{ color: '#10a37f', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>⚡ Action Required: Grant View Access</p>
                        <p style={{ fontSize: 13, color: '#d1d1d1', marginBottom: 16 }}>Add this email as a <strong>'Viewer'</strong> in your Google Analytics Property Access Management:</p>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                readOnly
                                value={SERVICE_EMAIL}
                                style={{ flex: 1, background: '#262626', border: '1px solid #3a3a3a', borderRadius: 6, padding: '8px 12px', color: '#10a37f', fontFamily: 'monospace', fontSize: 12 }}
                            />
                            <button
                                onClick={copyEmail}
                                style={{ padding: '8px 16px', background: copied ? '#0d2e26' : '#10a37f', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                            >
                                {copied ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>

                        <p style={{ fontSize: 11, color: '#6b6b7b', marginTop: 12 }}>
                            Note: We only need "Viewer" access to pull your organic search metrics.
                        </p>
                    </div>

                    <button
                        style={{ marginTop: 32, padding: '12px 28px', background: 'transparent', border: '1.5px solid #10a37f', color: '#10a37f', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => { window.location.href = '/dashboard' }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </Layout>
    )
}