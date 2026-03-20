import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 150)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center" style={{ background: '#020817' }}>
      <div className="text-center">
        {/* Glitch 404 */}
        <div className="relative mb-6">
          <div className="font-display text-[120px] font-black leading-none select-none"
            style={{
              color: 'transparent',
              WebkitTextStroke: '1px rgba(0,245,255,0.3)',
              textShadow: glitch
                ? '4px 0 rgba(248,113,113,0.8), -4px 0 rgba(0,245,255,0.8)'
                : '0 0 40px rgba(0,245,255,0.2)',
              transition: 'text-shadow 0.05s',
            }}>
            404
          </div>
          {glitch && (
            <div className="absolute inset-0 font-display text-[120px] font-black leading-none"
              style={{ color: 'rgba(248,113,113,0.4)', transform: 'translateX(6px)', userSelect: 'none' }}>
              404
            </div>
          )}
        </div>

        <div className="terminal-panel rounded-lg p-6 mb-6 max-w-sm mx-auto text-left">
          <p className="text-xs font-mono" style={{ color: 'rgba(0,245,255,0.5)' }}>
            {'>'} system.navigate()
          </p>
          <p className="text-xs font-mono text-red-400 mt-1">
            ERROR: Route not found in DAG
          </p>
          <p className="text-xs font-mono text-gray-600 mt-1">
            Node does not exist in pathway graph.
          </p>
          <p className="text-xs font-mono text-gray-700 mt-2">
            Stack: ReactRouter → ProtectedRoute → [null]
          </p>
        </div>

        <h2 className="font-display text-lg font-bold text-gray-300 mb-2">NODE NOT FOUND</h2>
        <p className="text-sm font-mono text-gray-600 mb-8">
          This route does not exist in the system graph.
        </p>

        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-neon-blue">
            ← GO BACK
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-neon-solid">
            → DASHBOARD
          </button>
        </div>
      </div>
    </div>
  )
}
