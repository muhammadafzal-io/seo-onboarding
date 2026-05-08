'use client'
import { useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'

export default function SettingsPage() {
  const [tgls, setTgls] = useState([true, true, false])
  const flip = (i: number) => setTgls(t => t.map((v,j) => j===i ? !v : v))

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
      <div
          onClick={onClick}
          className="w-[36px] h-[20px] rounded-[10px] cursor-pointer relative shrink-0 transition-colors duration-200"
          style={{ background: on ? 'var(--acc)' : 'var(--border)' }}
      >
        <div
            className="w-[14px] h-[14px] rounded-full bg-white absolute top-[3px] transition-all duration-200"
            style={{ left: on ? 19 : 3 }}
        />
      </div>
  )

  const Inp = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
      <div className="flex flex-col gap-[5px]">
        <label className="text-[11px] text-[var(--t2)] [font-family:var(--mono)] uppercase tracking-[0.06em]">
          {label}
        </label>
        <input
            {...props}
            className="bg-[#2a2a2a] border border-[var(--border)] rounded-[7px] py-[8px] px-[12px] text-[var(--t1)] text-[13px] outline-none w-full [font-family:var(--sans)] focus:border-[var(--acc)] transition-colors"
        />
      </div>
  )

  return (
      <Layout title="Settings">
        {/* HYBRID CSS OVERRIDES FOR MOBILE/TABLET */}
        <style>{`
        @media (max-width: 768px) {
          .responsive-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

        <div className="p-[16px] md:p-[24px] min-h-screen">
          <div className="mb-[20px]">
            <h2 className="text-[20px] font-semibold text-[var(--t1)] tracking-[-0.02em] mb-[4px] m-0">Settings</h2>
            <p className="text-[13px] text-[var(--t2)] m-0">Manage your account and preferences</p>
          </div>

          <div className="flex flex-col gap-[16px] max-w-[720px]">
            <Card>
              <h3 className="text-[13px] font-semibold text-[var(--t1)] mb-[14px] pb-[10px] border-b border-[var(--border2)] m-0">User Profile</h3>
              <div className="grid grid-cols-2 gap-[12px] responsive-grid">
                <Inp label="Full Name"  defaultValue="Muhammad Afzal" />
                <Inp label="Email"      defaultValue="muhammad.afzal@kalpayfinancials.com" type="email" />
                <Inp label="Domain"     defaultValue="kalpayfinancials.com" />
                <div className="flex flex-col gap-[5px]">
                  <label className="text-[11px] text-[var(--t2)] [font-family:var(--mono)] uppercase tracking-[0.06em]">Language</label>
                  <select className="bg-[#2a2a2a] border border-[var(--border)] rounded-[7px] py-[8px] px-[12px] text-[var(--t1)] text-[13px] outline-none w-full cursor-pointer focus:border-[var(--acc)] transition-colors">
                    <option>English</option><option>Urdu</option><option>Arabic</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-[13px] font-semibold text-[var(--t1)] mb-[14px] pb-[10px] border-b border-[var(--border2)] m-0">Notifications</h3>
              {[
                { label:'Email notifications',  desc:'Receive email when articles are published' },
                { label:'Workflow alerts',       desc:'Get notified when a workflow fails'        },
                { label:'Publishing alerts',     desc:'Alert when articles go live'               },
              ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between py-[10px] ${i < 2 ? 'border-b border-[var(--border2)]' : ''}`}>
                    <div className="pr-[16px]">
                      <div className="text-[13px] font-medium text-[var(--t1)] mb-[2px]">{item.label}</div>
                      <div className="text-[12px] text-[var(--t3)] leading-snug">{item.desc}</div>
                    </div>
                    <Toggle on={tgls[i]} onClick={() => flip(i)} />
                  </div>
              ))}
            </Card>

            <Card>
              <h3 className="text-[13px] font-semibold text-[var(--t1)] mb-[14px] pb-[10px] border-b border-[var(--border2)] m-0">Security</h3>
              <div className="grid grid-cols-2 gap-[12px] responsive-grid">
                <Inp label="Current Password" type="password" placeholder="••••••••" />
                <Inp label="New Password"     type="password" placeholder="••••••••" />
              </div>
            </Card>

            <button className="bg-[var(--acc)] text-white border-none rounded-[8px] py-[10px] px-[24px] text-[13px] font-semibold cursor-pointer [font-family:var(--sans)] self-start hover:brightness-110 transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </Layout>
  )
}