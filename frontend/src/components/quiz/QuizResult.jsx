const ACTION_CONFIG = {
  PASS: {
    color: '#00ff88',
    glow: 'rgba(0,255,136,0.4)',
    label: 'ASSESSMENT PASSED',
    icon: '✓',
    message: 'Module complete. Next topic has been unlocked.',
    border: 'rgba(0,255,136,0.3)',
  },
  REVISE: {
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    label: 'REVISION REQUIRED',
    icon: '⚠',
    message: 'Review the weak subtopics below before retaking.',
    border: 'rgba(251,191,36,0.3)',
  },
  RETRY: {
    color: '#f87171',
    glow: 'rgba(248,113,113,0.4)',
    label: 'RETRY REQUIRED',
    icon: '↺',
    message: 'Simpler resources have been loaded. Review fundamentals.',
    border: 'rgba(248,113,113,0.3)',
  },
}

export default function QuizResult({ result, skill, onClose }) {
  if (!result) return null
  const cfg = ACTION_CONFIG[result.action]
  const pct = Math.round(result.score * 100)

  return (
    <div className="space-y-5 text-center">
      {/* Status badge */}
      <div className="flex justify-center">
        <div className="px-6 py-3 rounded-lg"
          style={{
            background: `${cfg.color}10`,
            border: `1px solid ${cfg.border}`,
            boxShadow: `0 0 30px ${cfg.glow}`,
          }}>
          <div className="text-3xl mb-1">{cfg.icon}</div>
          <div className="font-display text-lg font-bold tracking-widest" style={{ color: cfg.color }}>
            {cfg.label}
          </div>
        </div>
      </div>

      {/* Score */}
      <div>
        <div className="font-display text-5xl font-black" style={{ color: cfg.color, textShadow: `0 0 30px ${cfg.glow}` }}>
          {pct}%
        </div>
        <div className="text-sm font-mono text-gray-500 mt-1">
          {result.correct} / {result.total} correct
        </div>
      </div>

      {/* Message */}
      <p className="text-sm font-mono text-gray-400">{cfg.message}</p>

      {/* Weak subtopics */}
      {result.weakSubtopics?.length > 0 && result.action !== 'PASS' && (
        <div className="text-left">
          <p className="text-xs font-mono mb-2" style={{ color: '#fbbf24' }}>WEAK SUBTOPICS:</p>
          <div className="flex flex-wrap gap-1.5">
            {result.weakSubtopics.map(t => (
              <span key={t} className="px-2 py-0.5 text-xs font-mono rounded"
                style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Adaptive engine log */}
      <div className="terminal-panel rounded p-3 text-left text-xs font-mono">
        <p style={{ color: 'rgba(0,245,255,0.5)' }}> adaptive_engine.update()</p>
        <p className="text-gray-500 mt-1">
          action=<span style={{ color: cfg.color }}>{result.action}</span>
          &nbsp;| score=<span style={{ color: cfg.color }}>{pct}%</span>
          &nbsp;| module=<span className="text-blue-400">{skill}</span>
        </p>
        {result.action === 'PASS' && <p className="text-green-400 mt-1">→ Next node unlocked in DAG.</p>}
        {result.action === 'REVISE' && <p className="text-yellow-400 mt-1">→ Status: revise · Targeted resources loaded.</p>}
        {result.action === 'RETRY' && <p className="text-red-400 mt-1">→ Status: retry · Beginner resources reloaded.</p>}
      </div>

      <button onClick={onClose} className="btn-neon-cyan w-full">
        CLOSE
      </button>
    </div>
  )
}
