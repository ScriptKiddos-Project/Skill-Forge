import { useNavigate } from 'react-router-dom'
import { statusToColor, scoreToLabel, formatHours } from '../../lib/utils'

const STATUS_BADGE = {
  complete: { label: 'PASSED', cls: 'badge-pass' },
  active: { label: 'ACTIVE', cls: 'badge-active' },
  revise: { label: 'REVISE', cls: 'badge-revise' },
  retry: { label: 'RETRY', cls: 'badge-retry' },
  locked: { label: 'LOCKED', cls: 'badge-locked' },
}

export default function SkillCard({ step, compact = false }) {
  const navigate = useNavigate()
  const badge = STATUS_BADGE[step.status] || STATUS_BADGE.locked
  const color = statusToColor(step.status)
  const isClickable = step.status !== 'locked'

  return (
    <div
      onClick={() => isClickable && navigate(`/topic/${step.id}`)}
      className={`glass-card p-4 transition-all duration-300 ${isClickable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
      style={{
        borderColor: `${color}30`,
        '--hover-shadow': `0 0 20px ${color}20`,
      }}
      onMouseEnter={e => isClickable && (e.currentTarget.style.boxShadow = `0 0 20px ${color}20, 0 0 1px ${color}40`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Order number */}
          <span className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
            {step.order}
          </span>
          <h3 className="font-body font-semibold text-sm text-gray-200 truncate">{step.skill}</h3>
        </div>
        <span className={badge.cls}>{badge.label}</span>
      </div>

      {!compact && (
        <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-500">
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            {formatHours(step.estimated_hours)}
          </span>
          <span className="capitalize">{step.difficulty}</span>
          <span>{step.type}</span>
          {step.quiz_score !== null && step.quiz_score !== undefined && (
            <span style={{ color: statusToColor(scoreToLabel(step.quiz_score).toLowerCase()) }}>
              {Math.round(step.quiz_score * 100)}% quiz
            </span>
          )}
        </div>
      )}

      {step.status === 'revise' && step.weak_subtopics?.length > 0 && !compact && (
        <div className="mt-2 flex flex-wrap gap-1">
          {step.weak_subtopics.map(t => (
            <span key={t} className="px-1.5 py-0.5 text-xs font-mono rounded"
              style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
              ↗ {t}
            </span>
          ))}
        </div>
      )}

      {step.status === 'locked' && (
        <div className="mt-2 flex items-center gap-1 text-xs font-mono text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Complete prerequisites to unlock
        </div>
      )}
    </div>
  )
}
