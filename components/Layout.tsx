'use client'
import { useState } from 'react'
import Header from './Header'
import Sidebar from './SideBar'

export default function Layout({ children, title }: { children: React.ReactNode; title: string }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            <style>{`
              @media (min-width: 1024px) {
                .mobile-overlay { display: none !important; }
                .desktop-layout-padding { padding-left: 220px !important; }
              }
            `}</style>

            {/* Moved Sidebar OUTSIDE the padded layout container so it anchors to the viewport */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="desktop-layout-padding flex flex-col min-h-screen">
                {sidebarOpen && <div className="mobile-overlay fixed inset-0 bg-black/50 z-[90]" onClick={() => setSidebarOpen(false)} />}

                <Header title={title} onMenuClick={() => setSidebarOpen(o => !o)} />

                <main className="flex-1 p-[16px] md:p-[24px] overflow-x-hidden">
                    {children}
                </main>
            </div>
        </>
    )
}