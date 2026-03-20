import { useState } from 'react'
import QuizQuestion from './QuizQuestion'
import QuizResult from './QuizResult'
import { demoQuizQuestions } from '../../data/demoProfile'
import { usePathwayStore } from '../../store/pathwayStore'
import { useAuthStore } from '../../store/authStore'

export default function QuizModal({ step, onClose, onResult }) {
  const [phase, setPhase] = useState('quiz') // quiz | result
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [result, setResult] = useState(null)
  const { updateStepStatus, addQuizResult } = usePathwayStore()
  const { isDemo } = useAuthStore()

  const questions = isDemo
    ? (demoQuizQuestions[step.skill] || generateFallback(step.skill))
    : []

  function handleAnswer(qId, optId) {
    setAnswers(prev => ({ ...prev, [qId]: optId }))
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1)
    }
  }

  function handlePrev() {
    if (currentQ > 0) setCurrentQ(c => c - 1)
  }

  function handleSubmit() {
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
    addQuizResult({ stepId: step.id, skill: step.skill, ...resultData, timestamp: new Date().toISOString() })
    onResult?.(resultData)
  }

  const allAnswered = questions.every(q => answers[q.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,8,23,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-2xl glass-card-cyan rounded-lg overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
          <div>
            <div className="text-xs font-mono text-gray-500 mb-1">MODULE ASSESSMENT // {step.id?.toUpperCase()}</div>
            <h2 className="font-display text-base font-bold" style={{ color: '#00f5ff' }}>
              {step.skill}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
                <span className="text-xs font-mono text-gray-500 ml-1">{currentQ + 1}/{questions.length}</span>
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
