'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/clients', label: 'Clients', icon: '◉' },
  { href: '/articles', label: 'Articles', icon: '◈' },
  { href: '/keywords', label: 'Keywords', icon: '◇' },
  { href: '/', label: 'Onboarding', icon: '✦', badge: 'NEW' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar({ open }: { open: boolean }) {
  const path = usePathname()

  return (
    <aside style={{
      width: 220, background: 'var(--sb)', borderRight: '1px solid var(--border2)',
      display: 'flex', flexDirection: 'column', padding: '20px 12px',
      position: 'fixed', top: 0, left: 0, bottom: 0, overflowY: 'auto',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', marginBottom: 28 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.01em' }}>The Brief</div>
          <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>SEO PLATFORM</div>
        </div>
      </div>

      <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--mono)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 }}>
        Menu
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map(item => {
          const active =
            item.href === '/dashboard' ? path === '/dashboard'
              : item.href === '/' ? path === '/'
                : path.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
              color: active ? 'var(--acc)' : 'var(--t2)',
              background: active ? 'var(--acc-l)' : 'transparent',
              fontWeight: active ? 600 : 500,
              fontSize: 13.5, textDecoration: 'none', transition: 'all .15s',
            }}>
              <span style={{ fontSize: 14, width: 16, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {item.badge && (
                <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--mono)', background: 'var(--acc)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ paddingTop: 16, borderTop: '1px solid var(--border2)', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--acc),#0d6e5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            MA
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>M. Afzal</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>Owner</div>
          </div>
        </div>
      </div>
    </aside>
  )
}