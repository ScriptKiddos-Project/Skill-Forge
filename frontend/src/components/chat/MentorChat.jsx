import { useState, useRef, useEffect } from 'react'
import { usePathwayStore } from '../../store/pathwayStore'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'

function ChatBubble({ msg }) {
  const isAI = msg.role === 'assistant'

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3`}>
      {isAI && (
        <div className="flex-shrink-0 w-6 h-6 rounded mr-2 flex items-center justify-center text-xs font-mono font-bold mt-1"
          style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}>
          AI
        </div>
      )}
      <div className="max-w-[85%] space-y-1.5">
        <div className="px-3 py-2.5 rounded text-xs font-mono leading-relaxed"
          style={{
            background: isAI ? 'rgba(6,14,31,0.8)' : 'rgba(0,102,255,0.12)',
            border: `1px solid ${isAI ? 'rgba(0,245,255,0.12)' : 'rgba(0,102,255,0.25)'}`,
            color: isAI ? '#94a3b8' : '#bfdbfe',
          }}>
          {isAI && <span style={{ color: 'rgba(0,245,255,0.5)' }}>{`> `}</span>}
          <span style={{ whiteSpace: 'pre-line' }}>{msg.content}</span>
        </div>

        {msg.attachment && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-all"
            style={{ background: 'rgba(6,14,31,0.8)', border: '1px solid rgba(0,245,255,0.15)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="1.5" className="w-3 h-3 flex-shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-xs font-mono" style={{ color: '#00f5ff' }}>{msg.attachment.name}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" className="w-3 h-3 ml-auto flex-shrink-0">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </div>
        )}

        <div className="text-gray-700 font-mono" style={{ fontSize: 10 }}>
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '--:--:--'}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex-shrink-0 w-6 h-6 rounded mr-2 flex items-center justify-center text-xs font-mono font-bold mt-1"
        style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}>
        AI
      </div>
      <div className="px-3 py-2.5 rounded" style={{ background: 'rgba(6,14,31,0.8)', border: '1px solid rgba(0,245,255,0.12)' }}>
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#00f5ff',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MentorChat({ compact = false }) {
  const { chatHistory, addMessage } = usePathwayStore()
  // ── Pull user_id from auth store so we can include it in every request ──
  const { isDemo, user } = useAuthStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isLoading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    addMessage(userMsg)
    setInput('')
    setIsLoading(true)

    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1200))
        const reply = getDemoReply(text)
        addMessage({ role: 'assistant', content: reply, timestamp: new Date().toISOString() })
      } else {

        // ── FIX: backend expects { message, user_id, history } ──────────
        const res = await api.post('/api/chat', {
          message: text,
          user_id: user?.id,
          history: [...chatHistory, userMsg].slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'mentor' : m.role,
            content: m.content
          }))
        })
        addMessage({ role: 'assistant', content: res.data.response, timestamp: new Date().toISOString() })
      }
    } catch (err) {
      console.error('Chat error:', err)
      addMessage({ role: 'mentor', content: 'Connection error. Please retry.', timestamp: new Date().toISOString() })
    } finally {
      setIsLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full terminal-panel rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.25)' }}>
              <span className="text-xs font-mono font-bold" style={{ color: '#00f5ff' }}>AI</span>
            </div>
            <span className="text-xs font-mono font-bold text-gray-200">Oracle_AI</span>
          </div>
          <div className="text-xs font-mono mt-0.5" style={{ color: '#00ff88', fontSize: 10 }}>LINK ESTABLISHED</div>
        </div>
        <div className="text-xs font-mono text-gray-600">
          Terminal Session Started: {new Date().toLocaleTimeString('en-US', { hour12: false })} UTC
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0" style={{ minHeight: 0 }}>
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs font-mono text-gray-600">
              {'> Oracle_AI ready. Ask me anything about your learning pathway.'}
            </p>
          </div>
        )}
        {chatHistory.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
        {isLoading && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'rgba(0,245,255,0.4)' }}>&gt;</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Enter command or query..."
            className="flex-1 bg-transparent text-xs font-mono text-gray-300 outline-none placeholder-gray-700"
            style={{ caretColor: '#00f5ff' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-all disabled:opacity-30"
            style={{
              background: 'rgba(0,245,255,0.1)',
              border: '1px solid rgba(0,245,255,0.2)',
              color: '#00f5ff',
            }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="text-gray-700 font-mono mt-1.5" style={{ fontSize: 9 }}>
          Press Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  )
}

function getDemoReply(msg) {
  const m = msg.toLowerCase()
  if (m.includes('bridge') || m.includes('host') || m.includes('network')) {
    return `Bridge mode creates an isolated virtual network inside Docker. Containers get their own IPs (172.17.x.x by default) and must explicitly publish ports to reach the host.\n\nHost mode removes isolation — the container shares the host's network namespace directly. Port 8080 in the container IS port 8080 on the host. Faster, but no isolation.\n\nRule of thumb: use bridge for services that need isolation; host for performance-critical or low-latency workloads.`
  }
  if (m.includes('docker') || m.includes('container')) {
    return `Docker containers share the host OS kernel but run in isolated namespaces (PID, net, mnt, uts). Images are layered — each instruction in a Dockerfile adds a layer.\n\nKey insight: a container is just a process with restrictions applied. It's not a VM.`
  }
  if (m.includes('kubernetes') || m.includes('k8s')) {
    return `Kubernetes orchestrates containers at scale. Core objects:\n\n• Pod — smallest unit, wraps 1+ containers\n• Deployment — manages pod replicas + rollouts\n• Service — stable network endpoint for pods\n• Ingress — HTTP routing from outside the cluster\n\nEKS (Elastic Kubernetes Service) runs the control plane for you on AWS. You only manage worker nodes.`
  }
  if (m.includes('quiz') || m.includes('score') || m.includes('result')) {
    return `Based on your quiz history:\n\n• System Design → 87% (PASS)\n• Docker → 58% (REVISE)\n\nThe Docker networking subtopic is flagged. I've queued the Docker_Net_Basics.md resource. Complete it and retake — you should clear 70% easily.`
  }
  return `Understood. I'm analyzing your query against your current pathway state...\n\nYou're at step 3/9 (Advanced React Patterns). Would you like me to explain the current module's prerequisites, generate a practice question, or search the course catalog for additional resources?`
}
