import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import DashboardClient from './DashboardClient'

// Server component — fetches initial data
export const revalidate = 0

async function getStats() {
  const [clients, articles, keywords, logs] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id, status, keyword, meta_title, updated_at, clients(name, domain)', { count: 'exact' }).order('updated_at', { ascending: false }).limit(6),
    supabase.from('keywords').select('id', { count: 'exact', head: true }),
    supabase.from('agent_logs').select('id, agent_name, action, status, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  const statusCounts = { published: 0, approved: 0, written: 0, processing: 0, failed: 0, scouted: 0 }
  ;(articles.data || []).forEach((a: any) => {
    const s = a.status as keyof typeof statusCounts
    if (s in statusCounts) statusCounts[s]++
  })

  return {
    totalClients:  clients.count  || 0,
    totalArticles: articles.count || 0,
    totalKeywords: keywords.count || 0,
    statusCounts,
    recentArticles: articles.data || [],
    recentLogs:     logs.data     || [],
  }
}

export default async function DashboardPage() {
  const stats = await getStats()
  return (
         <Layout title="Dashboard">
       <DashboardClient initialStats={stats} />
     </Layout>

  )

}


















// import Badge from "../../components/Badge"
// import Card from "../../components/Card"
// import Layout from "../../components/Layout"


// const KPI = [
//   { label:'Clients',   num:'24',   trend:'▲ 12%', icon:'◈', iconBg:'#0d2e26', iconColor:'#10a37f' },
//   { label:'Articles',  num:'318',  trend:'▲ 8%',  icon:'◇', iconBg:'#1a1a2e', iconColor:'#a78bfa' },
//   { label:'Keywords',  num:'1,204',trend:'▲ 24%', icon:'◆', iconBg:'#2a1f0a', iconColor:'#f59e0b' },
//   { label:'Workflows', num:'5',    trend:'● All running', icon:'⚙', iconBg:'#0f1e2e', iconColor:'#60a5fa' },
// ]

// const RECENT = [
//   { kw:'What is Manual QA',          domain:'test.com',       status:'published',  ago:'3m ago'  },
//   { kw:'AWS Cloud Computing Guide',   domain:'kaltech.online', status:'written',    ago:'18m ago' },
//   { kw:'Next.js Performance Tips',    domain:'devblog.io',     status:'processing', ago:'42m ago' },
//   { kw:'Software Testing Practices',  domain:'qaexperts.net',  status:'approved',   ago:'1h ago'  },
// ]

// const WFS = [
//   { name:'WF1 — Keyword Research', freq:'every 30m' },
//   { name:'WF2 — Article Writer',   freq:'every 15m' },
//   { name:'WF3 — Quality Review',   freq:'every 20m' },
//   { name:'WF4 — Publisher',        freq:'daily 9AM' },
//   { name:'WF5 — Watchdog',         freq:'every 2m'  },
// ]

// export default function DashboardPage() {
//   return (
//     <Layout title="Dashboard">
//       <div style={{ marginBottom:20 }}>
//         <h2 style={{ fontSize:20, fontWeight:600, color:'var(--t1)', letterSpacing:'-0.02em', marginBottom:4 }}>Dashboard</h2>
//         <p style={{ fontSize:13, color:'var(--t2)' }}>Overview of your content automation pipeline</p>
//       </div>

//       <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
//         {KPI.map(k => (
//           <Card key={k.label}>
//             <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
//               <span style={{ fontSize:11, color:'var(--t2)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{k.label}</span>
//               <div style={{ width:28, height:28, borderRadius:7, background:k.iconBg, color:k.iconColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{k.icon}</div>
//             </div>
//             <div style={{ fontSize:26, fontWeight:600, color:'var(--t1)', letterSpacing:'-0.03em', lineHeight:1 }}>{k.num}</div>
//             <div style={{ fontSize:11, color:'#10a37f', marginTop:5 }}>{k.trend}</div>
//           </Card>
//         ))}
//       </div>

//       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
//         <Card>
//           <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
//             <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>Recent Articles</h3>
//             <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--mono)' }}>Last 24h</span>
//           </div>
//           {RECENT.map(r => (
//             <div key={r.kw} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border2)' }}>
//               <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--acc)', flexShrink:0 }} />
//               <div style={{ flex:1 }}>
//                 <div style={{ fontSize:13, color:'var(--t1)', fontWeight:500 }}>{r.kw}</div>
//                 <div style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--mono)' }}>{r.domain} · {r.ago}</div>
//               </div>
//               <Badge status={r.status} />
//             </div>
//           ))}
//         </Card>

//         <Card>
//           <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
//             <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>Active Workflows</h3>
//             <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--mono)' }}>Live</span>
//           </div>
//           {WFS.map(w => (
//             <div key={w.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border2)' }}>
//               <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--acc)', flexShrink:0 }} />
//               <div style={{ flex:1, fontSize:13, color:'var(--t1)', fontWeight:500 }}>{w.name}</div>
//               <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--mono)' }}>{w.freq}</span>
//               <Badge status="active" />
//             </div>
//           ))}
//         </Card>
//       </div>

//       <Card>
//         <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)', marginBottom:12 }}>Quick Actions</h3>
//         <div style={{ display:'flex', gap:8 }}>
//           {['+ Add Keywords','✎ New Client','▶ Run WF2 Now','⊞ View Articles'].map(a => (
//             <button key={a} style={{
//               flex:1, padding:'9px 0', borderRadius:8, border:'1px solid var(--border)',
//               background:'#2a2a2a', color:'var(--t2)', fontSize:12, fontWeight:500,
//               cursor:'pointer', fontFamily:'var(--sans)', transition:'all .15s',
//             }}>{a}</button>
//           ))}
//         </div>
//       </Card>
//     </Layout>
//   )
// }
