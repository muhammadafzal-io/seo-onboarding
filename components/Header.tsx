'use client'

export default function Header({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  return (
    <header style={{
      height:52, flexShrink:0, background:'rgba(33,33,33,0.95)',
      backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border2)',
      display:'flex', alignItems:'center', padding:'0 24px', gap:16,
      position:'sticky', top:0, zIndex:30,
    }}>
      <button onClick={onMenuClick} style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:'var(--t2)', fontSize:18 }} className="mobile-menu">
        ☰
      </button>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--t1)', minWidth:120 }}>{title}</div>
      <div style={{ flex:1, maxWidth:320, position:'relative' }}>
        <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', fontSize:13 }}>◎</span>
        <input placeholder="Search articles, keywords..." style={{
          width:'100%', background:'#2a2a2a', border:'1px solid var(--border)',
          borderRadius:7, padding:'6px 10px 6px 32px', color:'var(--t1)', fontSize:13,
          outline:'none', fontFamily:'var(--sans)',
        }} />
      </div>
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, background:'#2a2a2a', border:'1px solid var(--border)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)', fontSize:14 }}>🔔</div>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--acc),#0d6e5a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer' }}>MA</div>
      </div>
    </header>
  )
}
