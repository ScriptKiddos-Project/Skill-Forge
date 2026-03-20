import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getInitials } from '../../lib/utils'

const NAV_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: 'Dashboard',
    path: '/dashboard',
    hex: '0xA1',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    label: 'Pathway',
    path: '/pathway',
    hex: '0xB2',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    label: 'Progress',
    path: '/progress',
    hex: '0xC3',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
    label: 'Mentor',
    path: '/mentor',
    hex: '0xD4',
  },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  return (
    <aside className="fixed left-0 top-0 h-full w-14 flex flex-col items-center py-4 z-50"
      style={{
        background: 'rgba(2,8,23,0.95)',
        borderRight: '1px solid rgba(15,32,64,0.8)',
        backdropFilter: 'blur(20px)',
      }}>
      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-8 h-8 flex items-center justify-center rounded"
          style={{
            background: 'linear-gradient(135deg, rgba(0,102,255,0.8), rgba(0,245,255,0.5))',
            boxShadow: '0 0 15px rgba(0,245,255,0.3)',
          }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
              fill="rgba(0,245,255,0.8)" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={item.label}
              className="relative group w-full flex items-center justify-center h-10 rounded transition-all duration-300"
              style={{
                color: isActive ? '#00f5ff' : '#4b5563',
                background: isActive ? 'rgba(0,245,255,0.08)' : 'transparent',
                boxShadow: isActive ? '0 0 15px rgba(0,245,255,0.15), inset 0 0 10px rgba(0,245,255,0.05)' : 'none',
                borderLeft: isActive ? '2px solid #00f5ff' : '2px solid transparent',
              }}
            >
              {item.icon}
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                style={{
                  background: 'rgba(6,14,31,0.95)',
                  border: '1px solid rgba(0,245,255,0.2)',
                  color: '#00f5ff',
                }}>
                {item.label}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Bottom - User + Logout */}
      <div className="flex flex-col items-center gap-3">
        {/* Onboarding button */}
        <button
          onClick={() => navigate('/onboarding')}
          title="New Analysis"
          className="w-8 h-8 flex items-center justify-center rounded transition-all duration-300 text-gray-500 hover:text-cyan-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold"
          style={{
            background: 'rgba(0,102,255,0.2)',
            border: '1px solid rgba(0,102,255,0.4)',
            color: '#60a5fa',
          }}>
          {user ? getInitials(user.full_name || user.email) : 'AI'}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/') }}
          title="Logout"
          className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:text-red-400 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
