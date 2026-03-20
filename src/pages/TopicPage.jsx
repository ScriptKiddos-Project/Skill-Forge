import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import ResourceList from '../components/pathway/ResourceList'
import ReasoningPanel from '../components/pathway/ReasoningPanel'
import QuizModal from '../components/quiz/QuizModal'
import { usePathwayStore } from '../store/pathwayStore'
import { demoPathway } from '../data/demoProfile'
import { statusToColor, formatHours } from '../lib/utils'

export default function TopicPage() {
  const { stepId } = useParams()
  const navigate = useNavigate()
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const { pathway, updateStepStatus } = usePathwayStore()

  const pw = pathway || demoPathway
  const step = pw.steps.find(s => s.id === stepId) || pw.steps[2] // fallback to step 3 (active)

  if (!step) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-gray-600">Step not found</p>
        </div>
      </AppLayout>
    )
  }

  const color = statusToColor(step.status)
  const prevStep = pw.steps[step.order - 2]
  const nextStep = pw.steps[step.order]

  function handleQuizResult(result) {
    setQuizResult(result)
  }

  return (
    <AppLayout>
      <div className="p-5 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-600 mb-5">
          <button onClick={() => navigate('/pathway')} className="hover:text-cyan-400 transition-colors">
            PATHWAY
          </button>
          <span>/</span>
          <span style={{ color: '#00f5ff' }}>{step.skill.toUpperCase()}</span>
          <span className="ml-auto" style={{ color }}>{step.status.toUpperCase()}</span>
        </div>

        {/* Topic header */}
        <div className="glass-card p-6 mb-5" style={{ borderColor: `${color}30` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="hex-id mb-1">MODULE {step.id?.slice(0, 8)}</div>
              <h1 className="font-display text-2xl font-bold mb-2" style={{ color }}>
                {step.skill}
              </h1>
              <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                <span className="capitalize">{step.category}</span>
                <span>·</span>
                <span className="capitalize">{step.difficulty}</span>
                <span>·</span>
                <span>{formatHours(step.estimated_hours)}</span>
                <span>·</span>
                <span>{step.type}</span>
                {step.quiz_score !== null && step.quiz_score !== undefined && (
                  <>
                    <span>·</span>
                    <span style={{ color }}>Quiz: {Math.round(step.quiz_score * 100)}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Quiz action */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {quizResult ? (
                <div className="text-right">
                  <div className="font-display text-2xl font-bold" style={{ color }}>
                    {Math.round(quizResult.score * 100)}%
                  </div>
                  <div className="text-xs font-mono" style={{ color }}>{quizResult.action}</div>
                </div>
              ) : (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="btn-neon-solid px-5 py-2.5"
                  disabled={step.status === 'locked'}>
                  TAKE QUIZ →
                </button>
              )}
              {step.quiz_attempts > 0 && (
                <span className="text-xs font-mono text-gray-600">
                  {step.quiz_attempts} attempt{step.quiz_attempts > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Main: resources */}
          <div className="col-span-2 space-y-5">
            <div className="glass-card p-5">
              <h2 className="text-xs font-mono text-gray-500 mb-4">LEARNING RESOURCES</h2>
              {step.resources?.length > 0 ? (
                <ResourceList resources={step.resources} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs font-mono text-gray-700">
                    // Resources load after pathway initialization
                  </p>
                </div>
              )}
            </div>

            {/* Reasoning panel */}
            <ReasoningPanel
              reasoning={step.reasoning}
              skillName={step.skill}
              weakSubtopics={step.weak_subtopics}
            />
          </div>

          {/* Sidebar: nav + info */}
          <div className="space-y-4">
            {/* Status card */}
            <div className="glass-card p-4" style={{ borderColor: `${color}20` }}>
              <h3 className="text-xs font-mono text-gray-500 mb-3">MODULE STATUS</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                <span className="font-mono font-bold text-sm" style={{ color }}>
                  {step.status.toUpperCase()}
                </span>
              </div>
              {step.status === 'revise' && step.weak_subtopics?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-mono text-yellow-400">Review needed:</p>
                  {step.weak_subtopics.map(t => (
                    <div key={t} className="text-xs font-mono text-gray-500">· {t}</div>
                  ))}
                </div>
              )}
              {step.status === 'complete' && (
                <p className="text-xs font-mono text-green-400">✓ Prerequisite satisfied</p>
              )}
            </div>

            {/* Navigation */}
            <div className="glass-card p-4 space-y-2">
              <h3 className="text-xs font-mono text-gray-500 mb-3">NAVIGATION</h3>
              {prevStep && (
                <button onClick={() => navigate(`/topic/${prevStep.id}`)}
                  className="w-full text-left p-2.5 rounded text-xs font-mono transition-all"
                  style={{ background: 'rgba(6,14,31,0.6)', border: '1px solid rgba(15,32,64,0.8)', color: '#6b7280' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,245,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(15,32,64,0.8)'}>
                  ← {prevStep.skill}
                </button>
              )}
              {nextStep && (
                <button onClick={() => nextStep.status !== 'locked' && navigate(`/topic/${nextStep.id}`)}
                  disabled={nextStep.status === 'locked'}
                  className="w-full text-left p-2.5 rounded text-xs font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(6,14,31,0.6)', border: '1px solid rgba(15,32,64,0.8)', color: '#6b7280' }}
                  onMouseEnter={e => nextStep.status !== 'locked' && (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(15,32,64,0.8)')}>
                  {nextStep.skill} →
                  {nextStep.status === 'locked' && ' 🔒'}
                </button>
              )}
              <button onClick={() => navigate('/pathway')}
                className="w-full text-left p-2.5 rounded text-xs font-mono transition-all"
                style={{ background: 'rgba(6,14,31,0.6)', border: '1px solid rgba(15,32,64,0.8)', color: '#6b7280' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00f5ff'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                ⬡ View Full Pathway
              </button>
            </div>

            {/* Quiz CTA if not shown */}
            {!quizResult && step.status !== 'locked' && (
              <div className="glass-card p-4" style={{ borderColor: 'rgba(0,245,255,0.15)' }}>
                <h3 className="text-xs font-mono text-gray-500 mb-2">ASSESSMENT</h3>
                <p className="text-xs font-mono text-gray-600 mb-3">
                  Complete resources then take the 5-question MCQ assessment to progress.
                </p>
                <button onClick={() => setShowQuiz(true)} className="btn-neon-cyan w-full py-2 text-xs">
                  INITIATE QUIZ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz modal */}
      {showQuiz && (
        <QuizModal
          step={step}
          onClose={() => setShowQuiz(false)}
          onResult={handleQuizResult}
        />
      )}
    </AppLayout>
  )
}
