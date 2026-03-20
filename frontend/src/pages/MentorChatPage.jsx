import AppLayout from '../components/layout/AppLayout'
import MentorChat from '../components/chat/MentorChat'
import { usePathwayStore } from '../store/pathwayStore'
import { demoPathway } from '../data/demoProfile'

export default function MentorChatPage() {
  const { pathway, chatHistory } = usePathwayStore()
  const pw = pathway || demoPathway
  const activeStep = pw.steps.find(s => s.status === 'active')

  return (
    <AppLayout>
      <div className="h-[calc(100vh-48px)] flex gap-5 p-5">
        {/* Sidebar context */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Current context */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-mono text-gray-500 mb-3">ACTIVE CONTEXT</h3>
            {activeStep ? (
              <div>
                <p className="text-sm font-body font-semibold text-gray-200 mb-1">{activeStep.skill}</p>
                <p className="text-xs font-mono text-gray-600">Status: <span style={{ color: '#60a5fa' }}>{activeStep.status}</span></p>
                {activeStep.weak_subtopics?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-mono text-yellow-400 mb-1">Weak topics:</p>
                    {activeStep.weak_subtopics.map(t => (
                      <p key={t} className="text-xs font-mono text-gray-600">· {t}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-mono text-gray-700">// No active module</p>
            )}
          </div>

          {/* Session info */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-mono text-gray-500 mb-3">SESSION INFO</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">Model</span>
                <span style={{ color: '#a78bfa' }}>LLaMA 3.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider</span>
                <span className="text-gray-400">Groq API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Context</span>
                <span className="text-gray-400">Last 6 msgs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Messages</span>
                <span style={{ color: '#00f5ff' }}>{chatHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode</span>
                <span className="text-green-400">Stateful</span>
              </div>
            </div>
          </div>

          {/* Quick prompts */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-mono text-gray-500 mb-3">QUICK QUERIES</h3>
            <div className="space-y-2">
              {[
                'Explain my current module',
                'What are my weak subtopics?',
                'Generate a practice question',
                'Why is this skill important?',
                'Show learning resources',
              ].map(q => (
                <button key={q} className="w-full text-left px-2.5 py-2 rounded text-xs font-mono text-gray-500 transition-all"
                  style={{ background: 'rgba(6,14,31,0.6)', border: '1px solid rgba(15,32,64,0.8)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#00f5ff'; e.currentTarget.style.borderColor = 'rgba(0,245,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'rgba(15,32,64,0.8)' }}>
                  &gt; {q}
                </button>
              ))}
            </div>
          </div>

          {/* Adaptive log */}
          <div className="terminal-panel rounded p-3">
            <p className="text-xs font-mono mb-2" style={{ color: 'rgba(0,245,255,0.4)' }}>ADAPTIVE LOG</p>
            <div className="space-y-1 text-xs font-mono text-gray-700">
              <p>Status: REVISE</p>
              <p style={{ color: '#fbbf24' }}>Weak: Docker Networking</p>
              <p>Resource: Docker_Net_Basics.md</p>
              <p style={{ color: '#6b7280' }}>Attempts: 2</p>
            </div>
          </div>
        </div>

        {/* Chat panel - full height */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          <MentorChat />
        </div>
      </div>
    </AppLayout>
  )
}
