'use client'

import { useState, useEffect } from 'react'
import { ClientWithGa } from '../../../types/analytics';
import Layout from '../../../components/Layout';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{children}</label>
}
function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 8, padding: '8px 12px', color: '#ececec', fontSize: mono ? 12 : 13, outline: 'none', fontFamily: mono ? 'monospace' : 'inherit', boxSizing: 'border-box' }}
      onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
      onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
    />
  )
}

type FormState = {
  property_id: string
  property_name: string
  timezone: string
  currency: string
  service_account_email: string
  credentials_json: string
}

const EMPTY_FORM: FormState = {
  property_id: '',
  property_name: '',
  timezone: 'UTC',
  currency: 'USD',
  service_account_email: '',
  credentials_json: '',
}

export default function GaSettingsPage() {
  const [clients, setClients] = useState<ClientWithGa[]>([])
  const [selected, setSelected] = useState<ClientWithGa | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/analytics/clients')
      .then(r => r.json())
      .then(data => {
        setClients(data)
        if (data.length > 0) selectClient(data[0])
      })
  }, [])

  const selectClient = (c: ClientWithGa) => {
    setSelected(c)
    const p = c.ga_property
    setForm(p ? {
      property_id: p.property_id,
      property_name: p.property_name || '',
      timezone: p.timezone || 'UTC',
      currency: p.currency || 'USD',
      service_account_email: p.service_account_email || '',
      credentials_json: '',
    } : EMPTY_FORM)
    setError('')
  }

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!selected) return
    if (!form.property_id.startsWith('properties/')) {
      setError('Property ID must start with "properties/" e.g. "properties/123456789"')
      return
    }

    setSaving(true); setError('')
    try {
      const res = await fetch('/api/analytics/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, client_id: selected.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')

      setToast('GA property saved successfully')
      setTimeout(() => setToast(''), 3000)

      // Refresh clients list
      const updated = await fetch('/api/analytics/clients').then(r => r.json())
      setClients(updated)
      const freshClient = updated.find((c: ClientWithGa) => c.id === selected.id)
      if (freshClient) selectClient(freshClient)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const section: React.CSSProperties = { background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, padding: 20, marginBottom: 16 }

  return (
    <Layout title="Analytics Settings">
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: '#0d2e26', border: '1px solid #10a37f', borderRadius: 8, padding: '10px 18px', color: '#10a37f', fontSize: 13, fontFamily: 'monospace' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: '28px 28px 28px 248px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 12, color: '#6b6b7b' }}>
            <a href="/analytics" style={{ color: '#6b6b7b', textDecoration: 'none' }}>Analytics</a>
            <span>›</span>
            <span style={{ color: '#ececec' }}>GA property settings</span>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#ececec', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Google Analytics properties
            </h1>
            <p style={{ fontSize: 13, color: '#6b6b7b' }}>
              Configure a GA4 property for each client. Each client can have its own service account credentials.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>

            <div style={{ ...section, padding: 12, alignSelf: 'start' }}>
              <div style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px', marginBottom: 6 }}>Clients</div>
              {clients.map(c => {
                const hasGa = !!c.ga_property?.is_active
                const isActive = selected?.id === c.id
                return (
                  <button key={c.id} onClick={() => selectClient(c)}
                    style={{ width: '100%', padding: '9px 10px', background: isActive ? '#0d2e26' : 'transparent', border: `1px solid ${isActive ? '#10a37f' : 'transparent'}`, borderRadius: 8, color: isActive ? '#10a37f' : '#8e8ea0', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || c.domain}</span>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: hasGa ? '#10a37f' : '#3a3a3a', flexShrink: 0, marginLeft: 6 }} />
                  </button>
                )
              })}
            </div>

            {selected && (
              <div>
                <div style={{ ...section }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #2a2a2a' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10a37f,#0d6e5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(selected.name || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#ececec' }}>{selected.name}</div>
                      <div style={{ fontSize: 12, color: '#4a4a4a', fontFamily: 'monospace' }}>{selected.domain}</div>
                    </div>
                    {selected.ga_property?.last_sync_error && (
                      <div style={{ marginLeft: 'auto', padding: '4px 10px', background: '#2a1515', border: '1px solid #5a2020', borderRadius: 6, fontSize: 11, color: '#f87171', fontFamily: 'monospace' }}>
                        ⚠ {selected.ga_property.last_sync_error.slice(0, 60)}…
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <FieldLabel>GA4 Property ID *</FieldLabel>
                      <TextInput value={form.property_id} onChange={v => set('property_id', v)} placeholder="properties/123456789" mono />
                      <p style={{ fontSize: 11, color: '#4a4a4a', marginTop: 4 }}>
                        Find in GA4 → Admin → Property → Property details
                      </p>
                    </div>
                    <div>
                      <FieldLabel>Property name</FieldLabel>
                      <TextInput value={form.property_name} onChange={v => set('property_name', v)} placeholder="Acme Corp — GA4" />
                    </div>
                    <div>
                      <FieldLabel>Service account email</FieldLabel>
                      <TextInput value={form.service_account_email} onChange={v => set('service_account_email', v)} placeholder="name@project.iam.gserviceaccount.com" mono />
                    </div>
                    <div>
                      <FieldLabel>Timezone</FieldLabel>
                      <TextInput value={form.timezone} onChange={v => set('timezone', v)} placeholder="America/New_York" mono />
                    </div>
                    <div>
                      <FieldLabel>Currency</FieldLabel>
                      <TextInput value={form.currency} onChange={v => set('currency', v)} placeholder="USD" mono />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <FieldLabel>
                        Service account credentials JSON
                        {form.credentials_json && ' (new value — leave blank to keep existing)'}
                      </FieldLabel>
                      <textarea
                        value={form.credentials_json}
                        onChange={e => set('credentials_json', e.target.value)}
                        rows={6}
                        placeholder={'{\n  "type": "service_account",\n  "client_email": "...",\n  "private_key": "..."\n}'}
                        style={{ width: '100%', background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 8, padding: '10px 12px', color: '#d1d1d1', fontSize: 11, outline: 'none', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
                      />
                      <p style={{ fontSize: 11, color: '#4a4a4a', marginTop: 4, lineHeight: 1.5 }}>
                        Grant <strong>Viewer</strong> access to the service account email in GA4 → Admin → Property access management.
                        In production, use Supabase Vault instead of storing JSON directly.
                      </p>
                    </div>
                  </div>
                </div>


                <div style={{ ...section, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#ececec', marginBottom: 12 }}>Setup checklist</div>
                  {[
                    ['1', 'Create a service account', 'Google Cloud Console → IAM → Service Accounts → Create'],
                    ['2', 'Download JSON key', 'Service Accounts → Keys → Add Key → JSON'],
                    ['3', 'Grant GA4 access', 'GA4 Admin → Property access management → Add users → Viewer role'],
                    ['4', 'Find property ID', 'GA4 Admin → Property → Property details → Property ID'],
                    ['5', 'Paste credentials above', 'Paste the full service account JSON into the field above'],
                  ].map(([num, title, desc]) => (
                    <div key={num} style={{ display: 'flex', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #2a2a2a' }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#10a37f', background: '#0d2e26', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</span>
                      <div>
                        <div style={{ fontSize: 13, color: '#d1d1d1', fontWeight: 500 }}>{title}</div>
                        <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {error && <div style={{ padding: '10px 14px', background: '#2a1515', border: '1px solid #5a2020', borderRadius: 8, color: '#f87171', fontSize: 13, fontFamily: 'monospace', marginBottom: 12 }}>⚠ {error}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <a href="/analytics" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 7, color: '#8e8ea0', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    ← Back to dashboard
                  </a>
                  <button onClick={handleSave} disabled={saving}
                    style={{ padding: '8px 22px', background: saving ? '#0a2420' : '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {saving ? (
                      <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Saving…</>
                    ) : '✓ Save GA property'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  )
}