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
  if (total === 0) return <span className="text-[11px] text-[#3a3a3a] font-mono">No articles yet</span>
  const pPub = (published / total) * 100
  const pPipe = (inPipeline / total) * 100
  const pFail = (failed / total) * 100

  return (
      <div>
        <div className="flex h-[5px] rounded-[3px] overflow-hidden bg-[#2a2a2a] mb-[5px]">
          <div className="bg-[#10a37f]" style={{ width: `${pPub}%` }} />
          <div className="bg-[#f59e0b]" style={{ width: `${pPipe}%` }} />
          <div className="bg-[#f87171]" style={{ width: `${pFail}%` }} />
        </div>
        <div className="flex gap-[10px]">
          {[
            { label: `${published} pub`, color: '#10a37f' },
            { label: `${inPipeline} live`, color: '#f59e0b' },
            ...(failed > 0 ? [{ label: `${failed} failed`, color: '#f87171' }] : []),
          ].map((s, i) => (
              <span key={i} className="text-[10px] font-mono" style={{ color: s.color }}>{s.label}</span>
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
      <div className={half ? "col-span-1" : "col-span-2"}>
        <label className="block text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.07em] mb-[5px]">{label}</label>
        <input type={type} value={(form[field] as string) || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder}
               className="w-full bg-[#262626] border border-[#3a3a3a] rounded-[7px] py-[8px] px-[10px] text-[#ececec] text-[13px] outline-none font-inherit box-border transition-colors focus:border-[#10a37f]"
        />
      </div>
  )

  const S = ({ label, field, options }: { label: string; field: keyof Client; options: string[] }) => (
      <div>
        <label className="block text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.07em] mb-[5px]">{label}</label>
        <select value={(form[field] as string) || ''} onChange={e => set(field, e.target.value)}
                className="w-full bg-[#262626] border border-[#3a3a3a] rounded-[7px] py-[8px] px-[10px] text-[#ececec] text-[13px] outline-none font-inherit">
          {options.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
        </select>
      </div>
  )

  return (
      <div className="fixed inset-0 bg-black/75 z-[1000] flex items-center justify-center p-[20px]"
           onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[16px] w-full max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="py-[20px] px-[24px] pb-[16px] border-b border-[#3a3a3a] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b6b7b] font-mono uppercase tracking-[0.1em] m-0 mb-[3px]">
                {state.mode === 'add' ? 'New Client' : 'Edit Client'}
              </p>
              <h2 className="text-[17px] font-semibold text-[#ececec] m-0">
                {state.mode === 'add' ? 'Add a new client' : form.name || form.domain}
              </h2>
            </div>
            <button onClick={onClose} className="bg-transparent border-none text-[#6b6b7b] cursor-pointer text-[20px] p-[4px] leading-none hover:text-[#ececec] transition-colors">✕</button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto py-[20px] px-[24px] grid grid-cols-2 gap-[14px]">
            <F label="Client Name" field="name" placeholder="Acme Corp" half />
            <F label="Email" field="email" placeholder="client@example.com" type="email" half />
            <F label="Domain" field="domain" placeholder="acme.com" half />
            <F label="Niche" field="niche" placeholder="Tech, Health, Finance..." half />
            <S label="Tone" field="tone" options={['Professional', 'Casual', 'Expert', 'Friendly', 'Authoritative']} />
            <S label="Schedule" field="schedule" options={['Daily', 'Weekly', 'Biweekly', 'Monthly']} />
            <S label="Platform" field="publish_platform" options={['WordPress', 'Shopify', 'Webflow', 'Ghost', 'Custom']} />
            <F label="Publish URL" field="publish_url" placeholder="https://acme.com/wp-json/wp/v2" half />
            <div className="col-span-2">
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
          </div>
        </div>
      </div>
  )
}

// ── Delete confirmation ───────────────────────────────────────
function DeleteModal({ client, onClose, onConfirm }: { client: Client; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  return (
      <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-[20px]"
           onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bg-[#2f2f2f] border border-[#5a2020] rounded-[14px] p-[28px] max-w-[400px] w-full">
          <div className="text-[24px] mb-[12px]">⚠</div>
          <h3 className="text-[16px] font-semibold text-[#ececec] m-0 mb-[8px]">Delete {client.name || client.domain}?</h3>
          <p className="text-[13px] text-[#8e8ea0] m-0 mb-[20px] leading-[1.6]">
            This will permanently delete the client and all associated articles and keywords. This cannot be undone.
          </p>
          <div className="flex gap-[8px] justify-end">
            <button onClick={onClose} className="py-[8px] px-[16px] bg-transparent border border-[#3f3f3f] rounded-[7px] text-[#8e8ea0] text-[13px] cursor-pointer font-inherit hover:text-[#ececec] transition-colors">Cancel</button>
            <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }} disabled={loading}
                    className="py-[8px] px-[20px] bg-[#b91c1c] border-none rounded-[7px] text-white text-[13px] font-semibold cursor-pointer font-inherit flex items-center gap-[8px] hover:bg-[#991b1b] transition-colors">
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

  // ── Shared Table Classes ──────────────────────────────────
  const thClasses = "py-[10px] px-[14px] text-left text-[#6b6b7b] text-[11px] font-mono uppercase tracking-[0.06em] whitespace-nowrap font-medium border-b border-[#3a3a3a]"
  const tdClasses = "py-[12px] px-[14px] border-b border-[#2a2a2a] text-[13px] align-middle"

  return (
      <Layout title="Clients">
        {modal.open && (
            <ClientModal state={modal} onClose={() => setModal({ open: false, mode: 'add', client: null })} onSave={handleSave} />
        )}
        {deleting && (
            <DeleteModal client={deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)} />
        )}

        {/* Toast */}
        {toast && (
            <div className="fixed bottom-[24px] right-[24px] z-[2000] bg-[#0d2e26] border border-[#10a37f] rounded-[8px] py-[10px] px-[18px] text-[#10a37f] text-[13px] font-medium font-mono">
              ✓ {toast}
            </div>
        )}

        <div className="min-h-screen bg-[#212121] text-[#ececec] py-[28px] pr-[28px] pl-[8px] [font-family:'Instrument_Sans',system-ui,sans-serif]">
          <div className="max-w-[1200px] mx-auto">

            {/* ── Page header ── */}
            <div className="flex items-start justify-between mb-[24px]">
              <div>
                <h1 className="text-[24px] font-bold text-[#ececec] tracking-[-0.03em] m-0 mb-[4px]">Clients</h1>
                <p className="text-[13px] text-[#6b6b7b] m-0">
                  {clients.length} client{clients.length !== 1 ? 's' : ''} · {totals.articles} total articles
                </p>
              </div>
              <button
                  onClick={() => setModal({ open: true, mode: 'add', client: EMPTY })}
                  className="py-[10px] px-[20px] bg-[#10a37f] border-none rounded-[8px] text-white text-[13px] font-semibold cursor-pointer font-inherit flex items-center gap-[8px] hover:bg-[#0e916f] transition-colors">
                + New Client
              </button>
            </div>

            {/* ── KPI row ── */}
            <div className="grid grid-cols-4 gap-[10px] mb-[24px]">
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
              <div className="relative flex-auto basis-[240px]">
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
              {filtered.length} of {clients.length}
            </span>
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
                <div className="text-center py-[60px] px-[20px] bg-[#2f2f2f] rounded-[12px] border border-[#3f3f3f]">
                  <div className="text-[36px] mb-[12px]">◉</div>
                  <p className="text-[15px] font-semibold text-[#ececec] m-0 mb-[8px]">
                    {search || filterNiche !== 'all' ? 'No clients match your filters' : 'No clients yet'}
                  </p>
                  <p className="text-[13px] text-[#6b6b7b] m-0 mb-[20px]">
                    {search || filterNiche !== 'all' ? 'Try adjusting your search or filter' : 'Add your first client to get started'}
                  </p>
                  {!search && filterNiche === 'all' && (
                      <button onClick={() => setModal({ open: true, mode: 'add', client: EMPTY })}
                              className="py-[10px] px-[20px] bg-[#10a37f] border-none rounded-[8px] text-white text-[13px] font-semibold cursor-pointer font-inherit hover:bg-[#0e916f] transition-colors">
                        + Add First Client
                      </button>
                  )}
                </div>
            )}

            {/* ── GRID VIEW ── */}
            {view === 'grid' && filtered.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[14px]">
                  {filtered.map(c => {
                    const ini = initials(c.name, c.domain)
                    const nc = nicheColor(c.niche)
                    const platf = PLATFORM_ICON[(c.publish_platform || '').toLowerCase()] || 'WP'
                    return (
                        <div key={c.id} className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[14px] p-[20px] flex flex-col gap-[14px] transition-colors cursor-default hover:border-[#4a4a4a]">

                          {/* Card header */}
                          <div className="flex items-start gap-[12px]">
                            {/* Avatar */}
                            <div className="w-[46px] h-[46px] rounded-[11px] border-[1.5px] flex items-center justify-center text-[16px] font-bold shrink-0"
                                 style={{ background: `linear-gradient(135deg, ${nc}33, ${nc}22)`, borderColor: `${nc}44`, color: nc }}>
                              {ini}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-[7px] mb-[2px]">
                                <h3 className="text-[14px] font-semibold text-[#ececec] m-0 overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                                  {c.name || c.domain}
                                </h3>
                                <span className="text-[9px] border px-[7px] py-[2px] rounded-[4px] font-mono shrink-0"
                                      style={{ color: nc, background: `${nc}22`, borderColor: `${nc}44` }}>
                            {c.niche || 'General'}
                          </span>
                              </div>
                              {c.domain && (
                                  <a href={`https://${c.domain}`} target="_blank" rel="noopener noreferrer"
                                     className="text-[12px] text-[#10a37f] no-underline font-mono hover:underline" onClick={e => e.stopPropagation()}>
                                    ↗ {c.domain}
                                  </a>
                              )}
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex gap-[8px] flex-wrap">
                            {c.tone && (
                                <span className="text-[10px] text-[#8e8ea0] bg-[#2a2a2a] py-[2px] px-[8px] rounded-[4px] font-mono">{c.tone}</span>
                            )}
                            {c.schedule && (
                                <span className="text-[10px] text-[#8e8ea0] bg-[#2a2a2a] py-[2px] px-[8px] rounded-[4px] font-mono">◷ {c.schedule}</span>
                            )}
                            <span className="text-[10px] text-[#8e8ea0] bg-[#2a2a2a] py-[2px] px-[8px] rounded-[4px] font-mono">{platf}</span>
                          </div>

                          {/* Article stats */}
                          <div>
                            <div className="flex justify-between mb-[6px]">
                              <span className="text-[11px] text-[#6b6b7b] font-mono">Articles</span>
                              <span className="text-[11px] text-[#8e8ea0] font-mono">{c.stats.total} total</span>
                            </div>
                            <PipelineBar stats={c.stats} />
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-[10px] border-t border-[#2a2a2a] mt-auto">
                      <span className="text-[11px] text-[#4a4a4a] font-mono">
                        {timeAgo(c.created_at)}
                      </span>
                            <div className="flex gap-[6px]">
                              <a href={`/client/${c.id}`}
                                 className="py-[5px] px-[12px] bg-[#2a2a2a] border border-[#3a3a3a] rounded-[6px] text-[#8e8ea0] text-[11px] no-underline font-medium font-inherit hover:bg-[#333] transition-colors">
                                View
                              </a>
                              <button onClick={() => setModal({ open: true, mode: 'edit', client: c })}
                                      className="py-[5px] px-[10px] bg-[#2a2a2a] border border-[#3a3a3a] rounded-[6px] text-[#8e8ea0] text-[11px] cursor-pointer font-inherit hover:bg-[#333] transition-colors">
                                ✎
                              </button>
                              <button onClick={() => setDeleting(c)}
                                      className="py-[5px] px-[10px] bg-transparent border border-[#3a3a3a] rounded-[6px] text-[#6b6b7b] text-[11px] cursor-pointer font-inherit hover:bg-[#2a2a2a] hover:text-[#f87171] transition-colors">
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
                <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-[12px] overflow-hidden">
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
        </div>
      </Layout>
  )
}