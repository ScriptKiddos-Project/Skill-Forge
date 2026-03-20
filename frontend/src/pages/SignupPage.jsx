import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'tech' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/signup', form)
      setAuth(res.data.user, res.data.access_token)
      navigate('/onboarding')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#020817' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(139,0,255,0.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,102,255,0.8), rgba(0,245,255,0.5))', boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z" fill="rgba(0,245,255,0.9)" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold tracking-widest neon-text-cyan">SKILLFORGE</span>
        </div>

        <div className="glass-card-cyan p-8 rounded-lg">
          <h1 className="font-display text-xl font-bold text-gray-100 mb-1">INITIALIZE PROFILE</h1>
          <p className="text-xs font-mono text-gray-600 mb-6">// Create your operator account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5">FULL_NAME</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Alex Chen" className="neon-input" required />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5">EMAIL_ADDRESS</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="operator@system.ai" className="neon-input" required />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5">PASSWORD</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Min 8 characters" className="neon-input" minLength={8} required />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5">OPERATOR_ROLE</label>
              <div className="grid grid-cols-3 gap-2">
                {['tech', 'business', 'ops'].map(role => (
                  <button key={role} type="button" onClick={() => set('role', role)}
                    className="py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200"
                    style={{
                      background: form.role === role ? 'rgba(0,245,255,0.1)' : 'rgba(6,14,31,0.6)',
                      border: `1px solid ${form.role === role ? 'rgba(0,245,255,0.45)' : 'rgba(15,32,64,0.8)'}`,
                      color: form.role === role ? '#00f5ff' : '#4b5563',
                      boxShadow: form.role === role ? '0 0 12px rgba(0,245,255,0.15)' : 'none',
                    }}>
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-xs font-mono text-red-400 px-3 py-2 rounded"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                ✗ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-neon-solid w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'INITIALIZING...' : 'CREATE OPERATOR →'}
            </button>
          </form>

          <p className="text-center text-xs font-mono text-gray-600 mt-5">
            Already registered?{' '}
            <Link to="/login" className="transition-colors hover:text-cyan-400" style={{ color: '#60a5fa' }}>
              LOGIN →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
