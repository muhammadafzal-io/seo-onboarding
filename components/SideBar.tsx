'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { href: '/clients', label: 'Clients', icon: '◉' },
    { href: '/onboarding', label: 'Onboarding', icon: '✦', badge: 'NEW' },
    { href: '/articles', label: 'Articles', icon: '◈' },
    { href: '/keywords', label: 'Keywords', icon: '◇' },
    { href: '/analytics', label: 'Analytics', icon: '▲' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const path = usePathname()

    return (
        <>
            <style>{`
          @media (min-width: 1024px) {
            .responsive-sidebar { 
              transform: translateX(0px) !important; 
              --tw-translate-x: 0px !important;
            }
            .mobile-close-btn { display: none !important; }
          }
        `}</style>

            <aside className={`responsive-sidebar w-[220px] h-screen bg-[var(--sb)] border-r border-[var(--border2)] flex flex-col py-[20px] px-[12px] fixed top-0 left-0 z-[100] overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Close button for mobile/tablet */}
                <button
                    onClick={onClose}
                    className="mobile-close-btn absolute top-[16px] right-[16px] text-[var(--t2)] hover:text-[var(--t1)] text-[20px] cursor-pointer bg-transparent border-none"
                >
                    ×
                </button>

                {/* Logo */}
                <div className="flex items-center gap-[10px] px-[4px] mb-[28px]">
                    <div className="w-[34px] h-[34px] rounded-[8px] bg-[var(--acc)] flex items-center justify-center text-[16px] shrink-0">✦</div>
                    <div>
                        <div className="text-[15px] font-[600] text-[var(--t1)] tracking-[-0.01em]">The Brief</div>
                        <div className="text-[9px] text-[var(--t3)] [font-family:var(--mono)] tracking-[0.1em]">SEO PLATFORM</div>
                    </div>
                </div>

                <div className="text-[9px] text-[var(--t3)] [font-family:var(--mono)] tracking-[0.12em] uppercase px-[8px] mb-[6px]">Menu</div>

                <nav className="flex flex-col gap-[2px] flex-1">
                    {NAV.map(item => {
                        const active =
                            item.href === '/dashboard' ? path === '/dashboard'
                                : item.href === '/' ? path === '/'
                                    : path.startsWith(item.href)

                        return (
                            <Link key={item.href} href={item.href} className={`flex items-center gap-[10px] py-[8px] px-[10px] rounded-[8px] text-[13.5px] no-underline transition-all duration-[150ms] ${active ? 'text-[var(--acc)] bg-[var(--acc-l)] font-[600]' : 'text-[var(--t2)] bg-transparent font-[500]'}`}>
                                <span className="text-[14px] w-[16px] text-center shrink-0">{item.icon}</span>
                                {item.label}
                                {item.badge && (
                                    <span className="ml-auto text-[9px] [font-family:var(--mono)] bg-[var(--acc)] text-[#fff] py-[2px] px-[6px] rounded-[4px]">
                                    {item.badge}
                                </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="pt-[10px] border-t border-[var(--border2)] mt-[8px] mb-[8px]">
                    <Link href="/analytics/settings" className={`flex items-center gap-[8px] py-[7px] px-[10px] rounded-[8px] text-[12px] no-underline ${path.includes('/analytics/settings') ? 'text-[var(--acc)] bg-[var(--acc-l)]' : 'text-[var(--t3)] bg-transparent'}`}>
                        <span className="text-[12px]">⚙</span> GA properties
                    </Link>
                </div>

                <div className="pt-[8px] border-t border-[var(--border2)]">
                    <div className="flex items-center gap-[8px] py-[6px] px-[8px]">
                        <div className="w-[28px] h-[28px] rounded-full bg-[linear-gradient(135deg,var(--acc),#0d6e5a)] flex items-center justify-center text-[11px] font-[600] text-[#fff] shrink-0">MA</div>
                        <div>
                            <div className="text-[12px] font-[600] text-[var(--t1)]">M. Afzal</div>
                            <div className="text-[10px] text-[var(--t3)] [font-family:var(--mono)]">Owner</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}