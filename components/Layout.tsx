'use client'
import { useState } from 'react'
import Header  from './Header'
import Sidebar from './SideBar';

export default function Layout({ children, title }: { children: React.ReactNode; title: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#212121;--sb:#171717;--card:#2f2f2f;--card2:#262626;
          --border:#3f3f3f;--border2:#2a2a2a;
          --t1:#ececec;--t2:#8e8ea0;--t3:#6b6b7b;
          --acc:#10a37f;--acc-l:#0d2e26;--acc-d:#0d8f6f;
          --red:#f87171;--red-l:#2a1515;
          --amber:#f59e0b;--amber-l:#2a1f0a;
          --blue:#60a5fa;--blue-l:#0f1e2e;
          --sans:'Instrument Sans',system-ui,sans-serif;
          --mono:'DM Mono',monospace;
        }
        html,body{height:100%;font-family:var(--sans);background:var(--bg);color:var(--t1)}
        *::-webkit-scrollbar{width:4px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:40}
        @media(max-width:1024px){
          .sb-fixed{transform:translateX(-100%);transition:transform .25s ease;z-index:50}
          .sb-fixed.open{transform:translateX(0)}
          .overlay.open{display:block}
          .main-shift{margin-left:0!important}
        }
      ` }} />

      <div onClick={() => setSidebarOpen(false)} className={`overlay${sidebarOpen ? ' open' : ''}`} />
      <Sidebar open={sidebarOpen} />

      <div className="main-shift" style={{ marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header title={title} onMenuClick={() => setSidebarOpen(o => !o)} />
        <main style={{ flex: 1, padding: 24, overflowX: 'hidden' }}>{children}</main>
      </div>
    </>
  )
}