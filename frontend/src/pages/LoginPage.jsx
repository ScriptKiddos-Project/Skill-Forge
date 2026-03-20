import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePathwayStore } from '../store/pathwayStore'
import { demoUser, demoPathway, demoSkillProfile, demoChatHistory } from '../data/demoProfile'
import api from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, setDemo } = useAuthStore()
  const { setPathway, setSkillProfile, setChatHistory } = usePathwayStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      setAuth(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  function handleDemo() {
    setDemo(demoUser, demoUser.token)
    setPathway(demoPathway)
    setSkillProfile(demoSkillProfile)
    setChatHistory(demoChatHistory)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#020817' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,102,255,0.08) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
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
          <h1 className="font-display text-xl font-bold text-gray-100 mb-1">SYSTEM ACCESS</h1>
          <p className="text-xs font-mono text-gray-600 mb-6">// Authenticate to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5">EMAIL_ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="operator@system.ai" className="neon-input" required />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5">PASSWORD_HASH</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••" className="neon-input" required />
            </div>

            {error && (
              <div className="text-xs font-mono text-red-400 px-3 py-2 rounded"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                ✗ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-neon-solid w-full py-3 mt-2 disabled:opacity-50">
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(15,32,64,0.8)' }} />
              <span className="text-xs font-mono text-gray-700">OR</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(15,32,64,0.8)' }} />
            </div>

            <button type="button" onClick={handleDemo} className="btn-neon-cyan w-full py-3">
              ENTER DEMO MODE
            </button>
          </form>

          <p className="text-center text-xs font-mono text-gray-600 mt-5">
            No account?{' '}
            <Link to="/signup" className="hover:text-cyan-400 transition-colors" style={{ color: '#60a5fa' }}>
              REGISTER →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
