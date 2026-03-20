import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePathwayStore } from '../../store/pathwayStore'

const ROUTE_LABELS = {
  '/dashboard': { label: 'SKILL GAP ANALYSIS', sub: 'Main Hub' },
  '/pathway': { label: 'LEARNING PATHWAY', sub: 'DAG View' },
  '/progress': { label: 'PROGRESS ANALYTICS', sub: 'Performance Metrics' },
  '/mentor': { label: 'MENTOR CHAT', sub: 'Oracle_AI Link' },
  '/onboarding': { label: 'ONBOARDING', sub: 'Profile Setup' },
  '/analyzing': { label: 'ANALYZING', sub: 'Processing Pipeline' },
}

export default function Navbar() {
  const location = useLocation()
  const { user, isDemo } = useAuthStore()
  const { pathway } = usePathwayStore()

  const routeInfo = ROUTE_LABELS[location.pathname] || { label: 'SKILLFORGE', sub: 'AI Engine' }

  return (
    <header className="fixed top-0 left-14 right-0 h-12 z-40 flex items-center justify-between px-5"
      style={{
        background: 'rgba(2,8,23,0.9)',
        borderBottom: '1px solid rgba(15,32,64,0.8)',
        backdropFilter: 'blur(20px)',
      }}>
      {/* Left: title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 6px #00ff88' }} />
         
        </div>
        <span className="text-gray-700">|</span>
        <h1 className="font-display text-sm font-bold tracking-widest"
          style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>
          {routeInfo.label}
        </h1>
        {pathway && (
          <span className="text-xs font-mono text-gray-500">
            · Target Role: <span style={{ color: '#60a5fa' }}>{pathway.target_role}</span>
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {isDemo && (
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded"
            style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            DEMO MODE
          </span>
        )}

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-all duration-200"
          style={{ color: '#60a5fa', border: '1px solid rgba(0,102,255,0.3)', borderRadius: 3, background: 'rgba(0,102,255,0.06)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 12px rgba(0,102,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          EXPORT_DATA
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-all duration-200"
          style={{ color: '#00f5ff', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 3, background: 'rgba(0,245,255,0.06)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 12px rgba(0,245,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          SYNC_PROFILE
        </button>
      </div>
    </header>
  )
}
