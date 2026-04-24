'use client'

export default function Header({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
    return (
        <>
            <style>{`
          @media (min-width: 1024px) {
            .mobile-hamburger { display: none !important; }
          }
        `}</style>

            <header className="h-[52px] shrink-0 bg-[rgba(33,33,33,0.95)] backdrop-blur-[16px] border-b border-[var(--border2)] flex items-center px-[16px] md:px-[24px] gap-[12px] md:gap-[16px] sticky top-0 z-30">
                <button onClick={onMenuClick} className="mobile-hamburger bg-transparent border-none cursor-pointer text-[var(--t2)] text-[18px]">
                    ☰
                </button>
                <div className="text-[14px] font-[600] text-[var(--t1)] hidden sm:block min-w-[120px]">{title}</div>
                <div className="flex-1 max-w-[320px] relative">
                    <span className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[var(--t3)] text-[13px]">◎</span>
                    <input
                        placeholder="Search articles, keywords..."
                        className="w-full bg-[#2a2a2a] border border-[var(--border)] rounded-[7px] py-[6px] pr-[10px] pl-[32px] text-[var(--t1)] text-[13px] outline-none [font-family:var(--sans)]"
                    />
                </div>
                <div className="ml-auto flex items-center gap-[10px]">
                    <div className="w-[32px] h-[32px] bg-[#2a2a2a] border border-[var(--border)] rounded-[7px] flex items-center justify-center cursor-pointer text-[var(--t2)] text-[14px]">🔔</div>
                    <div className="w-[32px] h-[32px] rounded-full bg-[linear-gradient(135deg,var(--acc),#0d6e5a)] flex items-center justify-center text-[12px] font-[600] text-[#fff] cursor-pointer">MA</div>
                </div>
            </header>
        </>
    )
}