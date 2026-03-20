import { useState, useEffect } from 'react'
import QuizQuestion from './QuizQuestion'
import QuizResult from './QuizResult'
import { demoQuizQuestions } from '../../data/demoProfile'
import { usePathwayStore } from '../../store/pathwayStore'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'

export default function QuizModal({ step, onClose, onResult }) {
  const [phase, setPhase] = useState('quiz') // quiz | result
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])
  const [quizId, setQuizId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { updateStepStatus, addQuizResult } = usePathwayStore()
  const { isDemo, user } = useAuthStore()

  // ── Fetch questions on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) {
      const q = demoQuizQuestions[step.skill] || generateFallback(step.skill)
      setQuestions(q)
      setLoading(false)
      return
    }

    async function fetchQuiz() {
      try {
        const res = await api.post('/api/quiz/generate', {
          skill_id: step.skill,
          difficulty: step.difficulty || 'intermediate',
          role: user?.role || 'tech',
        })

        // Backend returns options as "A) text" strings — convert to {id, text} objects
        const formatted = res.data.questions.map((q, qi) => ({
          id: `q${qi}`,
          question: q.question,
          subtopic: q.subtopic,
          correct: q.correct_answer.toLowerCase(),
          options: q.options.map((opt, i) => ({
            id: String.fromCharCode(97 + i), // 'a', 'b', 'c', 'd'
            text: opt.replace(/^[A-D]\) /, ''), // strip "A) " prefix
          })),
        }))

        setQuestions(formatted)
        setQuizId(res.data.quiz_id)
      } catch (e) {
        console.error('Quiz fetch error:', e)
        setError('Failed to load quiz. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [])

  // ── Answer handlers ───────────────────────────────────────────────────────
  function handleAnswer(qId, optId) {
    setAnswers(prev => ({ ...prev, [qId]: optId }))
  }

  function handleNext() {
    if (currentQ < questions.length - 1) setCurrentQ(c => c + 1)
  }

  function handlePrev() {
    if (currentQ > 0) setCurrentQ(c => c - 1)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const correct = questions.filter(q => answers[q.id] === q.correct).length
    const score = correct / questions.length
    const action = score >= 0.7 ? 'PASS' : score >= 0.4 ? 'REVISE' : 'RETRY'

    const weakSubtopics = questions
      .filter(q => answers[q.id] !== q.correct)
      .map(q => q.subtopic)
      .filter(Boolean)

    const resultData = { score, action, weakSubtopics, correct, total: questions.length }
    setResult(resultData)
    setPhase('result')

    const newStatus = action === 'PASS' ? 'complete' : action === 'REVISE' ? 'revise' : 'retry'
    updateStepStatus(step.id, newStatus, score)
    addQuizResult({
      stepId: step.id,
      skill: step.skill,
      ...resultData,
      timestamp: new Date().toISOString(),
    })
    onResult?.(resultData)

    // Submit to backend to save attempt + trigger adaptive engine
    if (!isDemo && quizId) {
      try {
        const answerList = questions.map(q => (answers[q.id] || 'A').toUpperCase())
        await api.post('/api/quiz/submit', {
          quiz_id: quizId,
          answers: answerList,
        })
      } catch (e) {
        console.error('Quiz submit error:', e)
      }
    }
  }

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(2,8,23,0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="text-center">
          <div className="flex gap-1.5 justify-center mb-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full"
                style={{
                  background: '#00f5ff',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.6,
                }} />
            ))}
          </div>
          <p className="font-mono text-xs text-cyan-400">Generating assessment for {step.skill}...</p>
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(2,8,23,0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="glass-card-cyan p-8 rounded-lg text-center max-w-sm w-full">
          <div className="text-red-400 font-mono text-xs mb-4">✗ {error}</div>
          <button onClick={onClose} className="btn-neon-blue px-6 py-2">CLOSE</button>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,8,23,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-2xl glass-card-cyan rounded-lg overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
          <div>
            <div className="text-xs font-mono text-gray-500 mb-1">
              MODULE ASSESSMENT // {step.id?.toUpperCase()}
            </div>
            <h2 className="font-display text-base font-bold" style={{ color: '#00f5ff' }}>
              {step.skill}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {phase === 'quiz' ? (
            <>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-5">
                {questions.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: i < currentQ
                        ? (answers[questions[i].id] === questions[i].correct ? '#00ff88' : '#f87171')
                        : i === currentQ
                        ? '#00f5ff'
                        : 'rgba(15,32,64,0.8)',
                      boxShadow: i === currentQ ? '0 0 8px rgba(0,245,255,0.5)' : 'none',
                    }}
                  />
                ))}
                <span className="text-xs font-mono text-gray-500 ml-1">
                  {currentQ + 1}/{questions.length}
                </span>
              </div>

              <QuizQuestion
                question={questions[currentQ]}
                selectedAnswer={answers[questions[currentQ]?.id]}
                onAnswer={(optId) => handleAnswer(questions[currentQ].id, optId)}
              />

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button onClick={handlePrev} disabled={currentQ === 0}
                  className="btn-neon-blue disabled:opacity-30 disabled:cursor-not-allowed">
                  ← PREV
                </button>
                {currentQ < questions.length - 1 ? (
                  <button onClick={handleNext} disabled={!answers[questions[currentQ]?.id]}
                    className="btn-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed">
                    NEXT →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={!allAnswered}
                    className="btn-neon-solid disabled:opacity-30 disabled:cursor-not-allowed">
                    SUBMIT ASSESSMENT
                  </button>
                )}
              </div>
            </>
          ) : (
            <QuizResult result={result} skill={step.skill} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}

function generateFallback(skill) {
  return [
    {
      id: 'f1',
      question: `Which of the following best describes ${skill}?`,
      subtopic: 'Core Concepts',
      options: [
        { id: 'a', text: 'A framework for building user interfaces' },
        { id: 'b', text: 'A technology stack for backend services' },
        { id: 'c', text: 'A specialized domain with specific tools and patterns' },
        { id: 'd', text: 'A database management system' },
      ],
      correct: 'c',
    },
  ]
}