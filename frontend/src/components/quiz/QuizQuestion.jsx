export default function QuizQuestion({ question, selectedAnswer, onAnswer }) {
  if (!question) return null

  return (
    <div className="space-y-4">
      {/* Subtopic tag */}
      {question.subtopic && (
        <div className="text-xs font-mono" style={{ color: '#60a5fa' }}>
          SUBTOPIC: {question.subtopic.toUpperCase()}
        </div>
      )}

      {/* Question */}
      <p className="text-base font-body font-semibold text-gray-100 leading-relaxed">
        {question.question}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt) => {
          const isSelected = selectedAnswer === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onAnswer(opt.id)}
              className="w-full text-left flex items-start gap-3 p-3 rounded transition-all duration-200"
              style={{
                background: isSelected ? 'rgba(0,245,255,0.06)' : 'rgba(6,14,31,0.6)',
                border: `1px solid ${isSelected ? 'rgba(0,245,255,0.4)' : 'rgba(15,32,64,0.8)'}`,
                boxShadow: isSelected ? '0 0 12px rgba(0,245,255,0.1)' : 'none',
              }}
            >
              {/* Option letter */}
              <span className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold"
                style={{
                  background: isSelected ? 'rgba(0,245,255,0.15)' : 'rgba(15,32,64,0.8)',
                  color: isSelected ? '#00f5ff' : '#4b5563',
                  border: `1px solid ${isSelected ? 'rgba(0,245,255,0.5)' : 'rgba(15,32,64,0.8)'}`,
                }}>
                {opt.id.toUpperCase()}
              </span>
              <span className="text-sm font-body text-gray-300 leading-relaxed">{opt.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
