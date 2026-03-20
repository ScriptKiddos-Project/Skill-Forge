import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePathwayStore } from '../store/pathwayStore'
import { createSSEStream } from '../lib/api'

const SSE_STAGES = [
  { id: 1, key: 'extracting', label: 'Extracting Skills', sub: 'PyMuPDF → spaCy noun chunks → O*NET cosine match → LLaMA confirmation', color: '#00f5ff' },
  { id: 2, key: 'gap', label: 'Computing Skill Gap', sub: 'Category-aware cosine similarity → knowledge_state per skill', color: '#60a5fa' },
  { id: 3, key: 'pathway', label: 'Building Pathway', sub: 'NetworkX DAG → prerequisite injection → topological sort', color: '#a78bfa' },
  { id: 4, key: 'resources', label: 'Fetching Resources', sub: 'FAISS query per skill → asyncio.gather parallel Explainer agent', color: '#34d399' },
  { id: 5, key: 'complete', label: 'Pipeline Complete', sub: 'Full pathway saved to DB → navigating to dashboard', color: '#00ff88' },
]

const DEMO_LOGS = [
  '> Initializing PyMuPDF text extraction...',
  '> Extracted 2,847 characters from resume',
  '> spaCy noun-chunk extraction: 23 candidates',
  '> O*NET cosine match: threshold=0.75',
  '> Confirmed skills: React, JavaScript, Node.js, REST APIs, Git, SQL, CSS',
  '> LLaMA disambiguation: 2 ambiguous terms resolved',
  '> Loading category-aware embeddings...',
  '> all-MiniLM-L6-v2 singleton initialized',
  '> Computing cosine similarity (category-filtered)...',
  '> Java/JavaScript false match prevented [category isolation]',
  '> Gap analysis complete: 7 skills flagged',
  '> Loading skill_graph.json (NetworkX DAG)...',
  '> 3 prerequisites auto-injected',
  '> Topological sort: 9-step pathway generated',
  '> FAISS index loaded: 100+ course catalog entries',
  '> asyncio.gather: 9 parallel Explainer calls',
  '> All reasoning traces generated',
  '> Pathway saved to PostgreSQL (row-level lock)',
  '> STATUS: COMPLETE',
]

export default function AnalyzingPage() {
  const [currentStage, setCurrentStage] = useState(0)
  const [logs, setLogs] = useState([])
  const [done, setDone] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { isDemo } = useAuthStore()
  const { pathway } = usePathwayStore()

  useEffect(() => {
    if (isDemo || !params.get('job_id')) {
      // Simulate SSE stages for demo
      simulateDemoSSE()
      return
    }
    const jobId = params.get('job_id')
    const cleanup = createSSEStream(
      jobId,
      (data) => setCurrentStage(data.stage_id - 1),
      () => { setDone(true); setTimeout(() => navigate('/dashboard'), 2000) },
      (err) => console.error(err)
    )
    return cleanup
  }, [])

  function simulateDemoSSE() {
    let stageIdx = 0
    let logIdx = 0

    const logInterval = setInterval(() => {
      if (logIdx < DEMO_LOGS.length) {
        setLogs(prev => [...prev, DEMO_LOGS[logIdx]])
        logIdx++
      }
    }, 280)

    const stageInterval = setInterval(() => {
      if (stageIdx < SSE_STAGES.length) {
        setCurrentStage(stageIdx)
        stageIdx++
      } else {
        clearInterval(stageInterval)
        clearInterval(logInterval)
        setDone(true)
        setTimeout(() => navigate('/dashboard'), 1500)
      }
    }, 1800)

    return () => { clearInterval(logInterval); clearInterval(stageInterval) }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-6" style={{ background: '#020817' }}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="hex-id mb-2">PIPELINE // 0x{Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase()}</div>
          <h1 className="font-display text-3xl font-black neon-text-cyan mb-2">ANALYZING</h1>
          <p className="text-sm font-mono text-gray-500">Processing your profile through the AI pipeline...</p>
        </div>

        {/* Stage list */}
        <div className="glass-card-cyan rounded-lg p-6 mb-5 space-y-4">
          {SSE_STAGES.map((stage, i) => {
            const isActive = i === currentStage
            const isDone = i < currentStage || done
            const isPending = i > currentStage && !done

            return (
              <div key={stage.id} className="flex items-start gap-4">
                {/* Status icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    background: isDone ? `${stage.color}15` : isActive ? `${stage.color}10` : 'rgba(6,14,31,0.8)',
                    border: `1px solid ${isDone ? stage.color : isActive ? `${stage.color}60` : 'rgba(15,32,64,0.8)'}`,
                    boxShadow: isActive ? `0 0 15px ${stage.color}40` : 'none',
                  }}>
                  {isDone ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke={stage.color} strokeWidth="2" className="w-4 h-4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-3 h-3 rounded-full animate-spin"
                      style={{ border: `2px solid ${stage.color}`, borderTopColor: 'transparent' }} />
                  ) : (
                    <span className="text-xs font-mono text-gray-700">{stage.id}</span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm transition-colors"
                    style={{ color: isDone ? stage.color : isActive ? '#e2e8f0' : '#374151' }}>
                    {stage.label}
                  </p>
                  <p className="text-xs font-mono mt-0.5 transition-colors"
                    style={{ color: isDone || isActive ? '#6b7280' : '#1f2937' }}>
                    {stage.sub}
                  </p>
                </div>

                {/* SSE badge */}
                <div className="text-xs font-mono flex-shrink-0"
                  style={{ color: isDone ? '#00ff88' : isActive ? '#fbbf24' : '#1f2937' }}>
                  {isDone ? 'DONE' : isActive ? 'ACTIVE' : 'PENDING'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Terminal log */}
        <div className="terminal-panel rounded-lg p-4 h-40 overflow-y-auto">
          <div className="space-y-0.5">
            {logs.map((log, i) => (
              <div key={i} className="text-xs font-mono"
                style={{ color: log.includes('COMPLETE') ? '#00ff88' : log.includes('prevented') ? '#fbbf24' : '#4b5563' }}>
                {log}
              </div>
            ))}
            {!done && (
              <div className="flex items-center gap-1 text-xs font-mono" style={{ color: '#00f5ff' }}>
                <span className="animate-pulse">▋</span>
              </div>
            )}
          </div>
        </div>

        {done && (
          <div className="text-center mt-5">
            <p className="text-sm font-mono" style={{ color: '#00ff88' }}>
              ✓ Pipeline complete · Navigating to dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
