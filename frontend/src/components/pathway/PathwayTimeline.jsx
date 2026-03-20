import { statusToColor } from '../../lib/utils'
import SkillCard from './SkillCard'

export default function PathwayTimeline({ steps = [] }) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(to bottom, rgba(0,245,255,0.4), rgba(0,102,255,0.1))' }} />

      <div className="space-y-3">
        {steps.map((step, i) => {
          const color = statusToColor(step.status)
          return (
            <div key={step.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-6 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: color,
                  background: `${color}20`,
                  boxShadow: step.status === 'active' ? `0 0 12px ${color}60` : 'none',
                }}>
                {step.status === 'complete' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" className="w-2 h-2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {step.status === 'active' && (
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                )}
                {(step.status === 'revise' || step.status === 'retry') && (
                  <span className="text-xs font-bold" style={{ color, fontSize: 8 }}>!</span>
                )}
              </div>

              <SkillCard step={step} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
