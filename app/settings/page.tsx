'use client'
import { useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'


export default function SettingsPage() {
  const [tgls, setTgls] = useState([true, true, false])
  const flip = (i: number) => setTgls(t => t.map((v,j) => j===i ? !v : v))

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <div onClick={onClick} style={{ width:36, height:20, borderRadius:10, background: on ? 'var(--acc)' : 'var(--border)', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
      <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: on ? 19 : 3, transition:'left .2s' }} />
    </div>
  )

  const Inp = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, color:'var(--t2)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
      <input {...props} style={{ background:'#2a2a2a', border:'1px solid var(--border)', borderRadius:7, padding:'8px 12px', color:'var(--t1)', fontSize:13, outline:'none', fontFamily:'var(--sans)', width:'100%' }} />
    </div>
  )

  return (
    <Layout title="Settings">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:600, color:'var(--t1)', letterSpacing:'-0.02em', marginBottom:4 }}>Settings</h2>
        <p style={{ fontSize:13, color:'var(--t2)' }}>Manage your account and preferences</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:720 }}>
        <Card>
          <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)', marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border2)' }}>User Profile</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Inp label="Full Name"  defaultValue="Muhammad Afzal" />
            <Inp label="Email"      defaultValue="muhammad.afzal@kalpayfinancials.com" type="email" />
            <Inp label="Domain"     defaultValue="kalpayfinancials.com" />
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:11, color:'var(--t2)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Language</label>
              <select style={{ background:'#2a2a2a', border:'1px solid var(--border)', borderRadius:7, padding:'8px 12px', color:'var(--t1)', fontSize:13, outline:'none', width:'100%' }}>
                <option>English</option><option>Urdu</option><option>Arabic</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)', marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border2)' }}>Notifications</h3>
          {[
            { label:'Email notifications',  desc:'Receive email when articles are published' },
            { label:'Workflow alerts',       desc:'Get notified when a workflow fails'        },
            { label:'Publishing alerts',     desc:'Alert when articles go live'               },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom: i < 2 ? '1px solid var(--border2)' : 'none' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--t1)' }}>{item.label}</div>
                <div style={{ fontSize:12, color:'var(--t3)' }}>{item.desc}</div>
              </div>
              <Toggle on={tgls[i]} onClick={() => flip(i)} />
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)', marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border2)' }}>Security</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Inp label="Current Password" type="password" placeholder="••••••••" />
            <Inp label="New Password"     type="password" placeholder="••••••••" />
          </div>
        </Card>

        <button style={{ background:'var(--acc)', color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--sans)', alignSelf:'flex-start', transition:'background .15s' }}>
          Save Changes
        </button>
      </div>
    </Layout>
  )
}
