import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PathwayTimeline from '../components/pathway/PathwayTimeline'
import SkillDAGGraph from '../components/graph/SkillDAGGraph'
import { usePathwayStore } from '../store/pathwayStore'
import { demoPathway } from '../data/demoProfile'

export default function PathwayPage() {
  const [view, setView] = useState('timeline') // timeline | dag
  const { pathway } = usePathwayStore()
  const pw = pathway || demoPathway
  const navigate = useNavigate()

  const complete = pw.steps.filter(s => s.status === 'complete').length
  const total = pw.steps.length
  const pct = Math.round((complete / total) * 100)

  return (
    <AppLayout>
      <div className="p-5 h-[calc(100vh-48px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-5 flex-shrink-0">
          <div>
           
            <h1 className="font-display text-xl font-bold neon-text-cyan">{pw.target_role}</h1>
            <p className="text-xs font-mono text-gray-500 mt-1">
              {complete}/{total} modules complete · ~{pw.estimated_hours}h remaining
            </p>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 p-1 rounded" style={{ background: 'rgba(6,14,31,0.8)', border: '1px solid rgba(15,32,64,0.8)' }}>
            {[
              { id: 'timeline', label: 'TIMELINE', icon: '≡' },
              { id: 'dag', label: 'DAG GRAPH', icon: '⬡' },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className="px-4 py-2 rounded text-xs font-mono font-bold transition-all"
                style={{
                  background: view === v.id ? 'rgba(0,245,255,0.1)' : 'transparent',
                  color: view === v.id ? '#00f5ff' : '#4b5563',
                  border: view === v.id ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
                  boxShadow: view === v.id ? '0 0 12px rgba(0,245,255,0.15)' : 'none',
                }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-gray-600">OVERALL PROGRESS</span>
            <span className="text-xs font-mono" style={{ color: '#00f5ff' }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,32,64,0.8)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #0066ff, #00f5ff)',
                boxShadow: '0 0 10px rgba(0,245,255,0.5)',
              }} />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
          {[
            { color: '#00ff88', label: 'COMPLETE' },
            { color: '#60a5fa', label: 'ACTIVE' },
            { color: '#fbbf24', label: 'REVISE' },
            { color: '#f87171', label: 'RETRY' },
            { color: '#374151', label: 'LOCKED' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}80` }} />
              <span className="text-xs font-mono text-gray-600">{l.label}</span>
            </div>
          ))}
        </div>

        {/* View content */}
        <div className="flex-1 overflow-hidden">
          {view === 'timeline' ? (
            <div className="h-full overflow-y-auto pr-2">
              <PathwayTimeline steps={pw.steps} />
            </div>
          ) : (
            <div className="h-full rounded-lg overflow-hidden glass-card">
              <SkillDAGGraph steps={pw.steps} />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
