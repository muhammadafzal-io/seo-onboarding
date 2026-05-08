'use client'

import { useState, useEffect } from 'react'
import { ClientWithGa } from '../../../types/analytics';
import Layout from '../../../components/Layout';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] text-[#6b6b7b] font-mono uppercase tracking-[0.07em] mb-[6px]">{children}</label>
}

function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
      <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full box-border bg-[#262626] border border-[#3a3a3a] rounded-[8px] py-[8px] px-[12px] text-[#ececec] outline-none transition-colors focus:border-[#10a37f] ${mono ? 'text-[12px] font-mono' : 'text-[13px] font-inherit'}`}
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

  return (
      <Layout title="Analytics Settings">
        {/* HYBRID CSS OVERRIDES FOR MOBILE/TABLET */}
        <style>{`
      
        .responsive-page-wrapper { padding: 28px 28px 28px 248px; }
        .responsive-main-grid { display: grid; grid-template-columns: 220px 1fr; gap: 16px; }
        .responsive-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .responsive-col-span-2 { grid-column: span 2; }
        .responsive-section { padding: 20px; }
        
        @media (max-width: 1024px) {
         
          .responsive-page-wrapper { padding: 24px !important; }
        }
        
        @media (max-width: 768px) {
          /* Mobile Overrides */
          .responsive-page-wrapper { padding: 16px !important; }
          .responsive-main-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .responsive-form-grid { grid-template-columns: 1fr !important; }
          .responsive-col-span-2 { grid-column: span 1 !important; }
          .responsive-client-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .responsive-error-badge { margin-left: 0 !important; width: 100% !important; margin-top: 8px !important; }
          .responsive-actions { flex-direction: column !important; width: 100% !important; }
          .responsive-actions > * { width: 100% !important; justify-content: center !important; }
          .responsive-section { padding: 16px !important; }
        }
      `}</style>

        {toast && (
            <div className="fixed bottom-[24px] right-[24px] z-[2000] bg-[#0d2e26] border border-[#10a37f] rounded-[8px] py-[10px] px-[18px] text-[#10a37f] text-[13px] font-mono">
              ✓ {toast}
            </div>
        )}

        <div className="min-h-[100vh] bg-[#212121] text-[#ececec] [font-family:'Instrument_Sans',system-ui,sans-serif] responsive-page-wrapper">
          <div className="max-w-[900px] mx-auto min-w-0">

            {/* Breadcrumb */}
            <div className="flex items-center gap-[6px] mb-[20px] text-[12px] text-[#6b6b7b] flex-wrap">
              <a href="/analytics" className="text-[#6b6b7b] no-underline hover:text-[#ececec] transition-colors">Analytics</a>
              <span>›</span>
              <span className="text-[#ececec]">GA property settings</span>
            </div>

            <div className="mb-[24px]">
              <h1 className="text-[20px] font-semibold text-[#ececec] tracking-[-0.02em] mb-[4px] m-0">
                Google Analytics properties
              </h1>
              <p className="text-[13px] text-[#6b6b7b] m-0">
                Configure a GA4 property for each client. Each client can have its own service account credentials.
              </p>
            </div>

            {/* MAIN GRID */}
            <div className="responsive-main-grid min-w-0">

              {/* Left Sidebar: Clients List */}
              <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] p-[12px] mb-[16px] self-start min-w-0 w-full">
                <div className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] py-[4px] px-[8px] mb-[6px]">Clients</div>
                {clients.map(c => {
                  const hasGa = !!c.ga_property?.is_active
                  const isActive = selected?.id === c.id
                  return (
                      <button
                          key={c.id}
                          onClick={() => selectClient(c)}
                          className={`w-full py-[9px] px-[10px] rounded-[8px] text-[13px] cursor-pointer text-left font-inherit flex items-center justify-between mb-[2px] transition-colors ${
                              isActive ? 'bg-[#0d2e26] border-[#10a37f] text-[#10a37f]' : 'bg-transparent border-transparent text-[#8e8ea0] hover:bg-[#3a3a3a]'
                          } border`}
                      >
                        {/* flex-1 ensures it pushes the dot to the right while allowing truncation */}
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1">{c.name || c.domain}</span>
                        <span className={`w-[7px] h-[7px] rounded-full shrink-0 ml-[6px] ${hasGa ? 'bg-[#10a37f]' : 'bg-[#3a3a3a]'}`} />
                      </button>
                  )
                })}
              </div>

              {/* Right Panel: Form */}
              {selected && (
                  <div className="min-w-0">
                    <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] mb-[16px] min-w-0 responsive-section">

                      {/* Selected Client Header */}
                      <div className="flex items-center gap-[10px] mb-[20px] pb-[14px] border-b border-[#2a2a2a] responsive-client-header min-w-0">
                        <div className="flex items-center gap-[10px] min-w-0 w-full sm:w-auto">
                          <div className="w-[36px] h-[36px] rounded-[9px] bg-[linear-gradient(135deg,#10a37f,#0d6e5a)] flex items-center justify-center text-[14px] font-bold text-white shrink-0">
                            {(selected.name || 'C')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-semibold text-[#ececec] truncate">{selected.name}</div>
                            <div className="text-[12px] text-[#4a4a4a] font-mono truncate">{selected.domain}</div>
                          </div>
                        </div>
                        {selected.ga_property?.last_sync_error && (
                            <div className="ml-auto py-[4px] px-[10px] bg-[#2a1515] border border-[#5a2020] rounded-[6px] text-[11px] text-[#f87171] font-mono break-words text-left responsive-error-badge">
                              ⚠ {selected.ga_property.last_sync_error}
                            </div>
                        )}
                      </div>

                      {/* FORM GRID */}
                      <div className="responsive-form-grid min-w-0">
                        <div className="responsive-col-span-2 min-w-0">
                          <FieldLabel>GA4 Property ID *</FieldLabel>
                          <TextInput value={form.property_id} onChange={v => set('property_id', v)} placeholder="properties/123456789" mono />
                          <p className="text-[11px] text-[#4a4a4a] mt-[4px] m-0">
                            Find in GA4 → Admin → Property → Property details
                          </p>
                        </div>
                        <div className="min-w-0">
                          <FieldLabel>Property name</FieldLabel>
                          <TextInput value={form.property_name} onChange={v => set('property_name', v)} placeholder="Acme Corp — GA4" />
                        </div>
                        <div className="min-w-0">
                          <FieldLabel>Service account email</FieldLabel>
                          <TextInput value={form.service_account_email} onChange={v => set('service_account_email', v)} placeholder="name@project.iam.gserviceaccount.com" mono />
                        </div>
                        <div className="min-w-0">
                          <FieldLabel>Timezone</FieldLabel>
                          <TextInput value={form.timezone} onChange={v => set('timezone', v)} placeholder="America/New_York" mono />
                        </div>
                        <div className="min-w-0">
                          <FieldLabel>Currency</FieldLabel>
                          <TextInput value={form.currency} onChange={v => set('currency', v)} placeholder="USD" mono />
                        </div>

                        <div className="responsive-col-span-2 min-w-0">
                          <FieldLabel>
                            Service account credentials JSON
                            {form.credentials_json && ' (new value — leave blank to keep existing)'}
                          </FieldLabel>
                          <textarea
                              value={form.credentials_json}
                              onChange={e => set('credentials_json', e.target.value)}
                              rows={6}
                              placeholder={'{\n  "type": "service_account",\n  "client_email": "...",\n  "private_key": "..."\n}'}
                              className="w-full box-border bg-[#1a1a1a] border border-[#3a3a3a] rounded-[8px] py-[10px] px-[12px] text-[#d1d1d1] text-[11px] outline-none font-mono resize-y leading-[1.6] transition-colors focus:border-[#10a37f]"
                          />
                          <p className="text-[11px] text-[#4a4a4a] mt-[4px] leading-[1.5] m-0 break-words">
                            Grant <strong>Viewer</strong> access to the service account email in GA4 → Admin → Property access management.
                            In production, use Supabase Vault instead of storing JSON directly.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Setup Checklist */}
                    <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] p-[16px] mb-[16px] min-w-0">
                      <div className="text-[12px] font-medium text-[#ececec] mb-[12px]">Setup checklist</div>
                      {[
                        ['1', 'Create a service account', 'Google Cloud Console → IAM → Service Accounts → Create'],
                        ['2', 'Download JSON key', 'Service Accounts → Keys → Add Key → JSON'],
                        ['3', 'Grant GA4 access', 'GA4 Admin → Property access management → Add users → Viewer role'],
                        ['4', 'Find property ID', 'GA4 Admin → Property → Property details → Property ID'],
                        ['5', 'Paste credentials above', 'Paste the full service account JSON into the field above'],
                      ].map(([num, title, desc]) => (
                          <div key={num} className="flex gap-[10px] mb-[10px] pb-[10px] border-b border-[#2a2a2a] min-w-0">
                            <span className="text-[10px] font-mono text-[#10a37f] bg-[#0d2e26] w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0">{num}</span>
                            <div className="min-w-0 flex-1">
                              {/* Using break-words prevents the list from truncating on smaller mobile screens */}
                              <div className="text-[13px] text-[#d1d1d1] font-medium break-words leading-tight">{title}</div>
                              <div className="text-[11px] text-[#4a4a4a] mt-[4px] break-words leading-snug">{desc}</div>
                            </div>
                          </div>
                      ))}
                    </div>

                    {error && (
                        <div className="py-[10px] px-[14px] bg-[#2a1515] border border-[#5a2020] rounded-[8px] text-[#f87171] text-[13px] font-mono mb-[12px] break-words">
                          ⚠ {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-[8px] responsive-actions">
                      <a href="/analytics" className="py-[8px] px-[16px] bg-transparent border border-[#3a3a3a] rounded-[7px] text-[#8e8ea0] text-[13px] no-underline flex items-center justify-center hover:text-[#ececec] transition-colors">
                        ← Back to dashboard
                      </a>
                      <button
                          onClick={handleSave}
                          disabled={saving}
                          className={`py-[8px] px-[22px] border-none rounded-[7px] text-white text-[13px] font-semibold flex items-center justify-center gap-[8px] font-inherit transition-colors ${
                              saving ? 'bg-[#0a2420] cursor-wait' : 'bg-[#10a37f] cursor-pointer hover:bg-[#0e916f]'
                          }`}
                      >
                        {saving ? (
                            <><div className="w-[12px] h-[12px] rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white animate-spin shrink-0" />Saving…</>
                        ) : '✓ Save GA property'}
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
  )
}