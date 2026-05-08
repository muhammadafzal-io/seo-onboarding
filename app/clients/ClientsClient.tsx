'use client'
import { useState, useMemo } from 'react'
import Layout from '../../components/Layout'

// ── Types ─────────────────────────────────────────────────────
type ClientStats = { total: number; published: number; inPipeline: number; failed: number }
type Client = {
  id: number; name: string; email: string; domain: string
  niche: string; tone: string; schedule: string
  publish_platform: string; publish_url: string
  notes: string; created_at: string; updated_at: string
  stats: ClientStats
}

// ── Helpers ───────────────────────────────────────────────────
function initials(name: string, domain: string) {
  const src = name || domain || '?'
  return src.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const mo = Math.floor(days / 30)
  return mo < 12 ? `${mo}mo ago` : `${Math.floor(mo / 12)}y ago`
}

const NICHE_COLORS: Record<string, string> = {
  tech: '#60a5fa', health: '#4ade80', finance: '#f59e0b',
  education: '#a78bfa', ecommerce: '#fb923c', legal: '#f87171',
  travel: '#34d399', food: '#fbbf24', general: '#8e8ea0',
}
function nicheColor(niche: string) {
  const key = (niche || '').toLowerCase().split(' ')[0]
  return NICHE_COLORS[key] || '#8e8ea0'
}

const PLATFORM_ICON: Record<string, string> = {
  wordpress: 'WP', shopify: 'SH', webflow: 'WF', ghost: 'GH', custom: 'CU',
}

// ── Mini progress bar ─────────────────────────────────────────
function PipelineBar({ stats }: { stats: ClientStats }) {
  const { total, published, inPipeline, failed } = stats
  if (total === 0) return <span style={{ fontSize: 11, color: '#3a3a3a', fontFamily: 'monospace' }}>No articles yet</span>
  const pPub = (published / total) * 100
  const pPipe = (inPipeline / total) * 100
  const pFail = (failed / total) * 100
  return (
    <div>
      <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', background: '#2a2a2a', marginBottom: 5 }}>
        <div style={{ width: `${pPub}%`, background: '#10a37f' }} />
        <div style={{ width: `${pPipe}%`, background: '#f59e0b' }} />
        <div style={{ width: `${pFail}%`, background: '#f87171' }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: `${published} pub`, color: '#10a37f' },
          { label: `${inPipeline} live`, color: '#f59e0b' },
          ...(failed > 0 ? [{ label: `${failed} failed`, color: '#f87171' }] : []),
        ].map((s, i) => (
          <span key={i} style={{ fontSize: 10, color: s.color, fontFamily: 'monospace' }}>{s.label}</span>
        ))}
      </div>
    </div>
  )
}

// ── Add/Edit Client modal ─────────────────────────────────────
type ModalMode = 'add' | 'edit'
type ModalState = { open: boolean; mode: ModalMode; client: Partial<Client> | null }

const EMPTY: Partial<Client> = {
  name: '', email: '', domain: '', niche: '', tone: 'Professional',
  schedule: 'Weekly', publish_platform: 'wordpress', publish_url: '', notes: '',
}

function ClientModal({ state, onClose, onSave }: {
  state: ModalState
  onClose: () => void
  onSave: (data: Partial<Client>, mode: ModalMode) => Promise<void>
}) {
  const [form, setForm] = useState<Partial<Client>>(state.client || EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof Client, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name && !form.domain) { setError('Name or Domain is required'); return }
    setLoading(true); setError('')
    try { await onSave(form, state.mode) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const F = ({ label, field, placeholder, type = 'text', half = false }: {
    label: string; field: keyof Client; placeholder?: string; type?: string; half?: boolean
  }) => (
<<<<<<< Updated upstream
    <div style={{ gridColumn: half ? 'span 1' : 'span 2' }}>
      <label style={{ display: 'block', fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</label>
      <input type={type} value={(form[field] as string) || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 7, padding: '8px 10px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
        onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
      />
    </div>
  )

  const S = ({ label, field, options }: { label: string; field: keyof Client; options: string[] }) => (
    <div>
      <label style={{ display: 'block', fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</label>
      <select value={(form[field] as string) || ''} onChange={e => set(field, e.target.value)}
        style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 7, padding: '8px 10px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
        {options.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    </div>
=======
      <div className={`${half ? "col-span-1" : "col-span-2"} responsive-modal-col`}>
        <label className="block text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.07em] mb-[5px]">{label}</label>
        <input type={type} value={(form[field] as string) || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder}
               className="w-full bg-[#262626] border border-[#3a3a3a] rounded-[7px] py-[8px] px-[10px] text-[#ececec] text-[13px] outline-none font-inherit box-border transition-colors focus:border-[#10a37f]"
        />
      </div>
  )

  const S = ({ label, field, options }: { label: string; field: keyof Client; options: string[] }) => (
      <div className="responsive-modal-col">
        <label className="block text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.07em] mb-[5px]">{label}</label>
        <select value={(form[field] as string) || ''} onChange={e => set(field, e.target.value)}
                className="w-full bg-[#262626] border border-[#3a3a3a] rounded-[7px] py-[8px] px-[10px] text-[#ececec] text-[13px] outline-none font-inherit">
          {options.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
        </select>
      </div>
>>>>>>> Stashed changes
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #3a3a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0  Asc 3px' }}>
              {state.mode === 'add' ? 'New Client' : 'Edit Client'}
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#ececec', margin: 0 }}>
              {state.mode === 'add' ? 'Add a new client' : form.name || form.domain}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b6b7b', cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1 }}>✕</button>
        </div>

<<<<<<< Updated upstream
        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <F label="Client Name" field="name" placeholder="Acme Corp" half />
          <F label="Email" field="email" placeholder="client@example.com" type="email" half />
          <F label="Domain" field="domain" placeholder="acme.com" half />
          <F label="Niche" field="niche" placeholder="Tech, Health, Finance..." half />
          <S label="Tone" field="tone" options={['Professional', 'Casual', 'Expert', 'Friendly', 'Authoritative']} />
          <S label="Schedule" field="schedule" options={['Daily', 'Weekly', 'Biweekly', 'Monthly']} />
          <S label="Platform" field="publish_platform" options={['WordPress', 'Shopify', 'Webflow', 'Ghost', 'Custom']} />
          <F label="Publish URL" field="publish_url" placeholder="https://acme.com/wp-json/wp/v2" half />
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Optional notes about this client..."
              style={{ width: '100%', background: '#262626', border: '1px solid #3a3a3a', borderRadius: 7, padding: '8px 10px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
              onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
            />
=======
          {/* Form */}
          <div className="flex-1 overflow-y-auto py-[20px] px-[24px] grid grid-cols-2 gap-[14px] responsive-modal-grid">
            <F label="Client Name" field="name" placeholder="Acme Corp" half />
            <F label="Email" field="email" placeholder="client@example.com" type="email" half />
            <F label="Domain" field="domain" placeholder="acme.com" half />
            <F label="Niche" field="niche" placeholder="Tech, Health, Finance..." half />
            <S label="Tone" field="tone" options={['Professional', 'Casual', 'Expert', 'Friendly', 'Authoritative']} />
            <S label="Schedule" field="schedule" options={['Daily', 'Weekly', 'Biweekly', 'Monthly']} />
            <S label="Platform" field="publish_platform" options={['WordPress', 'Shopify', 'Webflow', 'Ghost', 'Custom']} />
            <F label="Publish URL" field="publish_url" placeholder="https://acme.com/wp-json/wp/v2" half />
            <div className="col-span-2 responsive-modal-col">
              <label className="block text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.07em] mb-[5px]">Notes</label>
              <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Optional notes about this client..."
                        className="w-full bg-[#262626] border border-[#3a3a3a] rounded-[7px] py-[8px] px-[10px] text-[#ececec] text-[13px] outline-none font-inherit resize-y box-border transition-colors focus:border-[#10a37f]"
              />
            </div>
          </div>

          {/* Footer */}
          {error && <div className="py-[8px] px-[24px] bg-[#2a1515] border-t border-[#5a2020] text-[#f87171] text-[12px] font-mono">⚠ {error}</div>}
          <div className="py-[14px] px-[24px] border-t border-[#3a3a3a] flex justify-end gap-[8px]">
            <button onClick={onClose} className="py-[8px] px-[16px] bg-transparent border border-[#3f3f3f] rounded-[7px] text-[#8e8ea0] text-[13px] cursor-pointer font-inherit hover:text-[#ececec] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={loading}
                    className={`py-[8px] px-[20px] border-none rounded-[7px] text-white text-[13px] font-semibold flex items-center gap-[8px] font-inherit transition-colors ${loading ? 'bg-[#0a2420] cursor-wait' : 'bg-[#10a37f] cursor-pointer hover:bg-[#0e916f]'}`}>
              {loading
                  ? <><div className="w-[12px] h-[12px] rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving...</>
                  : state.mode === 'add' ? '+ Add Client' : '✓ Save Changes'}
            </button>
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Footer */}
        {error && <div style={{ padding: '8px 24px', background: '#2a1515', borderTop: '1px solid #5a2020', color: '#f87171', fontSize: 12, fontFamily: 'monospace' }}>⚠ {error}</div>}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #3a3a3a', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding: '8px 20px', background: loading ? '#0a2420' : '#10a37f', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading
              ? <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Saving...</>
              : state.mode === 'add' ? '+ Add Client' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation ───────────────────────────────────────
function DeleteModal({ client, onClose, onConfirm }: { client: Client; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#2f2f2f', border: '1px solid #5a2020', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⚠</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ececec', margin: '0 0 8px' }}>Delete {client.name || client.domain}?</h3>
        <p style={{ fontSize: 13, color: '#8e8ea0', margin: '0 0 20px', lineHeight: 1.6 }}>
          This will permanently delete the client and all associated articles and keywords. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3f3f3f', borderRadius: 7, color: '#8e8ea0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }} disabled={loading}
            style={{ padding: '8px 20px', background: '#b91c1c', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? 'Deleting...' : '✕ Delete Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [filterNiche, setFilterNiche] = useState('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', client: null })
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Filter / search ───────────────────────────────────────
  const niches = ['all', ...Array.from(new Set(clients.map(c => c.niche).filter(Boolean)))]
  const filtered = useMemo(() => clients.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || c.name?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q) || c.niche?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    const matchN = filterNiche === 'all' || c.niche === filterNiche
    return matchQ && matchN
  }), [clients, search, filterNiche])

  // ── Summary stats ─────────────────────────────────────────
  const totals = useMemo(() => ({
    clients: clients.length,
    articles: clients.reduce((s, c) => s + c.stats.total, 0),
    published: clients.reduce((s, c) => s + c.stats.published, 0),
    pipeline: clients.reduce((s, c) => s + c.stats.inPipeline, 0),
  }), [clients])

  // ── API calls ─────────────────────────────────────────────
  const handleSave = async (data: Partial<Client>, mode: ModalMode) => {
    const url = mode === 'edit' ? `/api/clients/${data.id}` : '/api/clients'
    const method = mode === 'edit' ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed')
    if (mode === 'add') {
      setClients(p => [{ ...json, stats: { total: 0, published: 0, inPipeline: 0, failed: 0 } }, ...p])
      showToast('Client added successfully')
    } else {
      setClients(p => p.map(c => c.id === json.id ? { ...c, ...json } : c))
      showToast('Client updated')
    }
    setModal({ open: false, mode: 'add', client: null })
  }

  const handleDelete = async (client: Client) => {
    const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    setClients(p => p.filter(c => c.id !== client.id))
    setDeleting(null)
    showToast('Client deleted')
  }

  // ── Styles ────────────────────────────────────────────────
  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left' as const, color: '#6b6b7b', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const, fontWeight: 500, borderBottom: '1px solid #3a3a3a' }
  const td: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid #2a2a2a', fontSize: 13, verticalAlign: 'middle' as const }

  return (
<<<<<<< Updated upstream
    <Layout title="Clients">
      {modal.open && (
        <ClientModal state={modal} onClose={() => setModal({ open: false, mode: 'add', client: null })} onSave={handleSave} />
      )}
      {deleting && (
        <DeleteModal client={deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)} />
      )}
=======
      <Layout title="Clients">
        {/* HYBRID CSS OVERRIDES FOR MOBILE/TABLET */}
        <style>{`
          /* Tablet & Mobile Tweaks */
          @media (max-width: 1023px) {
            .responsive-page { padding: 16px !important; }
            .table-wrapper { overflow-x: auto !important; }
          }
          @media (max-width: 768px) {
            .responsive-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .responsive-toolbar-search { flex-basis: 100% !important; }
            .responsive-modal-grid { grid-template-columns: 1fr !important; }
            .responsive-modal-col { grid-column: span 1 !important; }
            .responsive-header { flex-wrap: wrap !important; gap: 12px !important; }
          }
          @media (max-width: 480px) {
            /* Force single column for cards on tiny screens */
            .responsive-card-grid { grid-template-columns: 1fr !important; }
            /* Keep 2 columns for KPIs so it remains compact */
            .responsive-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>

        {modal.open && (
            <ClientModal state={modal} onClose={() => setModal({ open: false, mode: 'add', client: null })} onSave={handleSave} />
        )}
        {deleting && (
            <DeleteModal client={deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)} />
        )}
>>>>>>> Stashed changes

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: '#0d2e26', border: '1px solid #10a37f', borderRadius: 8, padding: '10px 18px', color: '#10a37f', fontSize: 13, fontWeight: 500, fontFamily: 'monospace' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ minHeight: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: '28px 28px 28px 8px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ── Page header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ececec', letterSpacing: '-0.03em', margin: '0 0 4px' }}>Clients</h1>
              <p style={{ fontSize: 13, color: '#6b6b7b', margin: 0 }}>
                {clients.length} client{clients.length !== 1 ? 's' : ''} · {totals.articles} total articles
              </p>
            </div>
            <button
              onClick={() => setModal({ open: true, mode: 'add', client: EMPTY })}
              style={{ padding: '10px 20px', background: '#10a37f', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
              + New Client
            </button>
          </div>

<<<<<<< Updated upstream
          {/* ── KPI row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Total Clients', value: totals.clients, color: '#ececec' },
              { label: 'Total Articles', value: totals.articles, color: '#60a5fa' },
              { label: 'Published', value: totals.published, color: '#10a37f' },
              { label: 'In Pipeline', value: totals.pipeline, color: '#f59e0b' },
            ].map(k => (
              <div key={k.label} style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: '#6b6b7b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{k.value}</div>
=======

        <div className="min-h-screen bg-[#212121] text-[#ececec] py-[28px] pr-[28px] pl-[8px] responsive-page [font-family:'Instrument_Sans',system-ui,sans-serif]">
          <div className="max-w-[1200px] mx-auto">

            {/* ── Page header ── */}

            <div className="flex items-start justify-between mb-[24px] responsive-header">
              <div>
                <h1 className="text-[24px] font-bold text-[#ececec] tracking-[-0.03em] m-0 mb-[4px]">Clients</h1>
                <p className="text-[13px] text-[#6b6b7b] m-0">
                  {clients.length} client{clients.length !== 1 ? 's' : ''} · {totals.articles} total articles
                </p>
>>>>>>> Stashed changes
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#4a4a4a', pointerEvents: 'none' }}>⌕</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search clients by name, domain, niche..."
                style={{ width: '100%', background: '#2f2f2f', border: '1px solid #3a3a3a', borderRadius: 8, padding: '9px 12px 9px 30px', color: '#ececec', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#10a37f')}
                onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
              />
            </div>

<<<<<<< Updated upstream
            {/* Niche filter */}
            <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)}
              style={{ background: '#2f2f2f', border: '1px solid #3a3a3a', borderRadius: 8, padding: '9px 12px', color: '#8e8ea0', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              {niches.map(n => <option key={n} value={n}>{n === 'all' ? 'All niches' : n}</option>)}
            </select>

            {/* View toggle */}
            <div style={{ display: 'flex', background: '#2f2f2f', border: '1px solid #3a3a3a', borderRadius: 8, overflow: 'hidden' }}>
              {(['grid', 'table'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '8px 14px', background: view === v ? '#3a3a3a' : 'transparent', border: 'none', color: view === v ? '#ececec' : '#6b6b7b', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: view === v ? 600 : 400 }}>
                  {v === 'grid' ? '⊞ Grid' : '≡ Table'}
                </button>
              ))}
            </div>

            <span style={{ fontSize: 12, color: '#4a4a4a', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
=======
            {/* ── KPI row ── */}

            <div className="grid grid-cols-4 gap-[10px] mb-[24px] responsive-kpi-grid">
              {[
                { label: 'Total Clients', value: totals.clients, color: '#ececec' },
                { label: 'Total Articles', value: totals.articles, color: '#60a5fa' },
                { label: 'Published', value: totals.published, color: '#10a37f' },
                { label: 'In Pipeline', value: totals.pipeline, color: '#f59e0b' },
              ].map(k => (
                  <div key={k.label} className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[10px] py-[14px] px-[16px]">
                    <div className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.08em] mb-[6px]">{k.label}</div>
                    <div className="text-[28px] font-bold tracking-[-0.04em] leading-none" style={{ color: k.color }}>{k.value}</div>
                  </div>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex gap-[10px] mb-[20px] flex-wrap items-center">
              {/* Search */}

              <div className="relative flex-auto basis-[240px] responsive-toolbar-search">
                <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#4a4a4a] pointer-events-none">⌕</span>
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search clients by name, domain, niche..."
                    className="w-full bg-[#2f2f2f] border border-[#3a3a3a] rounded-[8px] py-[9px] pr-[12px] pl-[30px] text-[#ececec] text-[13px] outline-none font-inherit box-border transition-colors focus:border-[#10a37f]"
                />
              </div>

              {/* Niche filter */}
              <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)}
                      className="bg-[#2f2f2f] border border-[#3a3a3a] rounded-[8px] py-[9px] px-[12px] text-[#8e8ea0] text-[13px] outline-none font-inherit cursor-pointer focus:border-[#10a37f] transition-colors">
                {niches.map(n => <option key={n} value={n}>{n === 'all' ? 'All niches' : n}</option>)}
              </select>

              {/* View toggle */}
              <div className="flex bg-[#2f2f2f] border border-[#3a3a3a] rounded-[8px] overflow-hidden">
                {(['grid', 'table'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                            className={`py-[8px] px-[14px] border-none text-[12px] cursor-pointer font-inherit transition-colors ${view === v ? 'bg-[#3a3a3a] text-[#ececec] font-semibold' : 'bg-transparent text-[#6b6b7b] font-normal hover:text-[#ececec]'}`}>
                      {v === 'grid' ? '⊞ Grid' : '≡ Table'}
                    </button>
                ))}
              </div>

              <span className="text-[12px] text-[#4a4a4a] font-mono whitespace-nowrap">
>>>>>>> Stashed changes
              {filtered.length} of {clients.length}
            </span>
          </div>

          {/* ── Empty state ── */}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#2f2f2f', borderRadius: 12, border: '1px solid #3f3f3f' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>◉</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#ececec', margin: '0 0 8px' }}>
                {search || filterNiche !== 'all' ? 'No clients match your filters' : 'No clients yet'}
              </p>
              <p style={{ fontSize: 13, color: '#6b6b7b', margin: '0 0 20px' }}>
                {search || filterNiche !== 'all' ? 'Try adjusting your search or filter' : 'Add your first client to get started'}
              </p>
              {!search && filterNiche === 'all' && (
                <button onClick={() => setModal({ open: true, mode: 'add', client: EMPTY })}
                  style={{ padding: '10px 20px', background: '#10a37f', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Add First Client
                </button>
              )}
            </div>
          )}

          {/* ── GRID VIEW ── */}
          {view === 'grid' && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {filtered.map(c => {
                const ini = initials(c.name, c.domain)
                const nc = nicheColor(c.niche)
                const platf = PLATFORM_ICON[(c.publish_platform || '').toLowerCase()] || 'WP'
                return (
                  <div key={c.id} style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color .15s', cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#4a4a4a')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#3f3f3f')}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Avatar */}
                      <div style={{ width: 46, height: 46, borderRadius: 11, background: `linear-gradient(135deg, ${nc}33, ${nc}22)`, border: `1.5px solid ${nc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: nc, flexShrink: 0 }}>
                        {ini}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#ececec', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {c.name || c.domain}
                          </h3>
                          <span style={{ fontSize: 9, color: nc, background: `${nc}22`, border: `1px solid ${nc}44`, padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>
                            {c.niche || 'General'}
                          </span>
                        </div>
                        {c.domain && (
                          <a href={`https://${c.domain}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: '#10a37f', textDecoration: 'none', fontFamily: 'monospace' }} onClick={e => e.stopPropagation()}>
                            ↗ {c.domain}
                          </a>
                        )}
                      </div>
                    </div>

<<<<<<< Updated upstream
                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {c.tone && (
                        <span style={{ fontSize: 10, color: '#8e8ea0', background: '#2a2a2a', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{c.tone}</span>
                      )}
                      {c.schedule && (
                        <span style={{ fontSize: 10, color: '#8e8ea0', background: '#2a2a2a', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>◷ {c.schedule}</span>
                      )}
                      <span style={{ fontSize: 10, color: '#8e8ea0', background: '#2a2a2a', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{platf}</span>
                    </div>

                    {/* Article stats */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#6b6b7b', fontFamily: 'monospace' }}>Articles</span>
                        <span style={{ fontSize: 11, color: '#8e8ea0', fontFamily: 'monospace' }}>{c.stats.total} total</span>
                      </div>
                      <PipelineBar stats={c.stats} />
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #2a2a2a', marginTop: 'auto' }}>
                      <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>
                        {timeAgo(c.created_at)}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={`/client/${c.id}`}
                          style={{ padding: '5px 12px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 6, color: '#8e8ea0', fontSize: 11, textDecoration: 'none', fontWeight: 500, fontFamily: 'inherit' }}>
                          View
                        </a>
                        <button onClick={() => setModal({ open: true, mode: 'edit', client: c })}
                          style={{ padding: '5px 10px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 6, color: '#8e8ea0', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ✎
                        </button>
                        <button onClick={() => setDeleting(c)}
                          style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 6, color: '#6b6b7b', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── TABLE VIEW ── */}
          {view === 'table' && filtered.length > 0 && (
            <div style={{ background: '#2f2f2f', border: '1px solid #3f3f3f', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, paddingLeft: 20 }}>Client</th>
                    <th style={th}>Niche</th>
                    <th style={th}>Platform</th>
                    <th style={{ ...th, textAlign: 'right' as const }}>Articles</th>
                    <th style={{ ...th, textAlign: 'right' as const }}>Published</th>
                    <th style={{ ...th, textAlign: 'right' as const }}>Pipeline</th>
                    <th style={{ ...th, textAlign: 'center' as const }}>Schedule</th>
                    <th style={{ ...th, textAlign: 'right' as const }}>Added</th>
                    <th style={{ ...th, textAlign: 'right' as const, paddingRight: 20 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
=======
            {/* ── GRID VIEW ── */}

            {view === 'grid' && filtered.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[14px] responsive-card-grid">
>>>>>>> Stashed changes
                  {filtered.map(c => {
                    const ini = initials(c.name, c.domain)
                    const nc = nicheColor(c.niche)
                    return (
                      <tr key={c.id}
                        onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        style={{ transition: 'background .1s' }}>
                        {/* Client */}
                        <td style={{ ...td, paddingLeft: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${nc}22`, border: `1px solid ${nc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: nc, flexShrink: 0 }}>
                              {ini}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#ececec' }}>{c.name || c.domain}</div>
                              {c.domain && c.name && <div style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{c.domain}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 11, color: nc, background: `${nc}22`, padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace' }}>
                            {c.niche || 'General'}
                          </span>
                        </td>
                        <td style={{ ...td, color: '#8e8ea0', fontFamily: 'monospace', fontSize: 12 }}>
                          {c.publish_platform || '—'}
                        </td>
                        <td style={{ ...td, textAlign: 'right' as const, fontFamily: 'monospace', color: '#ececec', fontWeight: 600 }}>
                          {c.stats.total}
                        </td>
                        <td style={{ ...td, textAlign: 'right' as const, fontFamily: 'monospace', color: '#10a37f' }}>
                          {c.stats.published}
                        </td>
                        <td style={{ ...td, textAlign: 'right' as const, fontFamily: 'monospace', color: '#f59e0b' }}>
                          {c.stats.inPipeline}
                        </td>
                        <td style={{ ...td, textAlign: 'center' as const }}>
                          <span style={{ fontSize: 11, color: '#8e8ea0', fontFamily: 'monospace' }}>{c.schedule || '—'}</span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' as const, color: '#4a4a4a', fontFamily: 'monospace', fontSize: 11 }}>
                          {timeAgo(c.created_at)}
                        </td>
                        <td style={{ ...td, textAlign: 'right' as const, paddingRight: 20 }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <a href={`/client/${c.id}`}
                              style={{ padding: '4px 10px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 5, color: '#8e8ea0', fontSize: 11, textDecoration: 'none', fontFamily: 'inherit' }}>
                              View
                            </a>
                            <a href={`/articles?clientId=${c.id}`}
                              style={{ padding: '4px 10px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 5, color: '#8e8ea0', fontSize: 11, textDecoration: 'none', fontFamily: 'inherit' }}>
                              Articles
                            </a>
                            <button onClick={() => setModal({ open: true, mode: 'edit', client: c })}
                              style={{ padding: '4px 10px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 5, color: '#8e8ea0', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Edit
                            </button>
                            <button onClick={() => setDeleting(c)}
                              style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 5, color: '#6b6b7b', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

<<<<<<< Updated upstream
=======
            {/* ── TABLE VIEW ── */}

            {view === 'table' && filtered.length > 0 && (
                <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] overflow-hidden table-wrapper">
                  <table className="w-full border-collapse">
                    <thead>
                    <tr>
                      <th className={`${thClasses} pl-[20px]`}>Client</th>
                      <th className={thClasses}>Niche</th>
                      <th className={thClasses}>Platform</th>
                      <th className={`${thClasses} text-right`}>Articles</th>
                      <th className={`${thClasses} text-right`}>Published</th>
                      <th className={`${thClasses} text-right`}>Pipeline</th>
                      <th className={`${thClasses} text-center`}>Schedule</th>
                      <th className={`${thClasses} text-right`}>Added</th>
                      <th className={`${thClasses} text-right pr-[20px]`}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map(c => {
                      const ini = initials(c.name, c.domain)
                      const nc = nicheColor(c.niche)
                      return (
                          <tr key={c.id} className="transition-colors hover:bg-[#2a2a2a]">
                            {/* Client */}
                            <td className={`${tdClasses} pl-[20px]`}>
                              <div className="flex items-center gap-[10px]">
                                <div className="w-[32px] h-[32px] rounded-[8px] border flex items-center justify-center text-[12px] font-bold shrink-0"
                                     style={{ background: `${nc}22`, borderColor: `${nc}44`, color: nc }}>
                                  {ini}
                                </div>
                                <div>
                                  <div className="text-[13px] font-semibold text-[#ececec]">{c.name || c.domain}</div>
                                  {c.domain && c.name && <div className="text-[11px] text-[#4a4a4a] font-mono">{c.domain}</div>}
                                </div>
                              </div>
                            </td>
                            <td className={tdClasses}>
                          <span className="text-[11px] py-[2px] px-[7px] rounded-[4px] font-mono"
                                style={{ color: nc, background: `${nc}22` }}>
                            {c.niche || 'General'}
                          </span>
                            </td>
                            <td className={`${tdClasses} text-[#8e8ea0] font-mono text-[12px]`}>
                              {c.publish_platform || '—'}
                            </td>
                            <td className={`${tdClasses} text-right font-mono text-[#ececec] font-semibold`}>
                              {c.stats.total}
                            </td>
                            <td className={`${tdClasses} text-right font-mono text-[#10a37f]`}>
                              {c.stats.published}
                            </td>
                            <td className={`${tdClasses} text-right font-mono text-[#f59e0b]`}>
                              {c.stats.inPipeline}
                            </td>
                            <td className={`${tdClasses} text-center`}>
                              <span className="text-[11px] text-[#8e8ea0] font-mono">{c.schedule || '—'}</span>
                            </td>
                            <td className={`${tdClasses} text-right text-[#4a4a4a] font-mono text-[11px]`}>
                              {timeAgo(c.created_at)}
                            </td>
                            <td className={`${tdClasses} text-right pr-[20px]`}>
                              <div className="flex gap-[6px] justify-end">
                                <a href={`/client/${c.id}`}
                                   className="py-[4px] px-[10px] bg-[#2a2a2a] border border-[#3a3a3a] rounded-[5px] text-[#8e8ea0] text-[11px] no-underline font-inherit hover:bg-[#333] transition-colors">
                                  View
                                </a>
                                <a href={`/articles?clientId=${c.id}`}
                                   className="py-[4px] px-[10px] bg-[#2a2a2a] border border-[#3a3a3a] rounded-[5px] text-[#8e8ea0] text-[11px] no-underline font-inherit hover:bg-[#333] transition-colors">
                                  Articles
                                </a>
                                <button onClick={() => setModal({ open: true, mode: 'edit', client: c })}
                                        className="py-[4px] px-[10px] bg-[#2a2a2a] border border-[#3a3a3a] rounded-[5px] text-[#8e8ea0] text-[11px] cursor-pointer font-inherit hover:bg-[#333] transition-colors">
                                  Edit
                                </button>
                                <button onClick={() => setDeleting(c)}
                                        className="py-[4px] px-[10px] bg-transparent border border-[#3a3a3a] rounded-[5px] text-[#6b6b7b] text-[11px] cursor-pointer font-inherit hover:bg-[#2a2a2a] hover:text-[#f87171] transition-colors">
                                  Del
                                </button>
                              </div>
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
            )}

          </div>
>>>>>>> Stashed changes
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  )
}

