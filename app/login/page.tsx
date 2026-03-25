'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'login' | 'signup'>('login')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (view === 'signup') {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) alert(error.message)
      else alert('Check your email to confirm your account!')
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        alert(error.message)
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        
        :root {
          --bg: #212121;
          --sb: #171717;
          --card: #2f2f2f;
          --border: #3f3f3f;
          --acc: #10a37f;
          --t1: #ececec;
          --t3: #8e8ea0;
          --mono: 'DM Mono', monospace;
          --serif: 'Fraunces', serif;
          --sans: 'Instrument Sans', sans-serif;
        }

        .auth-input {
          width: 100%; padding: 12px; background: var(--sb);
          border: 1px solid var(--border); border-radius: 10px;
          color: var(--t1); font-family: var(--sans); font-size: 14px;
          transition: all 0.2s; outline: none;
        }
        .auth-input:focus { border-color: var(--acc); box-shadow: 0 0 0 3px rgba(16,163,127,0.1); }
        
        .btn-primary {
          width: 100%; padding: 13px; background: var(--acc); color: #fff;
          border: none; border-radius: 10px; font-weight: 600; cursor: pointer;
          font-family: var(--sans); transition: transform 0.1s, background 0.2s;
        }
        .btn-primary:hover { background: #0d8f6f; }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div style={{ backgroundColor: 'var(--bg)', color: 'var(--t1)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', padding: '20px' }}>
        
        {/* Brand Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }} className="fade-in">
          <div style={{ 
            width: 52, height: 52, borderRadius: 14, background: 'var(--acc)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: 24, margin: '0 auto 16px', color: '#fff', boxShadow: '0 8px 16px rgba(16,163,127,0.2)' 
          }}>✦</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: 300, letterSpacing: '-0.03em' }}>The Brief</h1>
          <p style={{ color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '6px' }}>SEO Automation Pipeline</p>
        </div>

        {/* Auth Card */}
        <div style={{ width: '100%', maxWidth: '400px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }} className="fade-in">
          
          {/* Toggle Tab */}
          <div style={{ display: 'flex', background: 'var(--sb)', padding: '4px', borderRadius: '12px', marginBottom: '28px', border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setView('login')}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', background: view === 'login' ? 'var(--card)' : 'transparent', color: view === 'login' ? 'var(--acc)' : 'var(--t3)' }}
            >Sign In</button>
            <button 
              onClick={() => setView('signup')}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', background: view === 'signup' ? 'var(--card)' : 'transparent', color: view === 'signup' ? 'var(--acc)' : 'var(--t3)' }}
            >New Account</button>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--t3)', display: 'block', marginBottom: '8px', fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
              <input 
                className="auth-input"
                type="email" required placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px', color: 'var(--t3)', display: 'block', marginBottom: '8px', fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>PASSWORD</label>
              <input 
                className="auth-input"
                type="password" required placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button disabled={loading} type="submit" className="btn-primary">
              {loading ? (
                <span style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                  {[0, 0.1, 0.2].map((d, i) => (
                    <span key={i} style={{ width: 4, height: 4, background: '#fff', borderRadius: '50%', animation: `pulse 1s infinite ${d}s` }} />
                  ))}
                </span>
              ) : (
                <>{view === 'login' ? 'Sign In to Dashboard' : 'Create Pipeline Account'}</>
              )}
            </button>
          </form>

          {view === 'login' && (
            <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--t3)' }}>
                Forgot your password? <span style={{ color: 'var(--acc)', cursor: 'pointer', fontWeight: 500 }}>Reset Pipeline</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p style={{ marginTop: '32px', fontSize: '11px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
          SECURE ENCRYPTED ACCESS • v1.0.4
        </p>
      </div>
    </>
  )
}