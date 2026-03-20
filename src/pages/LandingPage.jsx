import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const FEATURES = [
  {
    hex: '0x01',
    title: 'AI Gap Analysis',
    desc: 'Upload your resume and JD to instantly map missing skills.',
    color: '#00f5ff',
  },
  {
    hex: '0x02',
    title: 'Adaptive Pathways',
    desc: 'Get a custom curriculum curated from top-tier resources.',
    color: '#60a5fa',
  },
  {
    hex: '0x03',
    title: 'Knowledge Gating',
    desc: 'Prove your mastery with dynamic MCQs before advancing.',
    color: '#a78bfa',
  },
  {
    hex: '0x04',
    title: '24/7 AI Mentor',
    desc: 'Stuck on a concept? Chat with our AI tutor instantly.',
    color: '#34d399',
  },
  {
    hex: '0x05',
    title: 'Smart Recommendations',
    desc: 'Curated resources ranked by relevance to your exact skill gap.',
    color: '#f59e0b',
  },
  {
    hex: '0x06',
    title: 'Progress Analytics',
    desc: 'Track your learning velocity and quiz scores in real time.',
    color: '#f87171',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }))

    let frame
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,245,255,${p.alpha})`
        ctx.fill()
      })
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,102,255,${0.15 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#020817' }}>
      {/* Animated particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,102,255,0.12) 0%, transparent 70%)' }} />

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'rgba(15,32,64,0.6)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,102,255,0.8), rgba(0,245,255,0.5))', boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z" fill="rgba(0,245,255,0.9)" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-base font-bold tracking-widest" style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>
              SKILLFORGE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-neon-blue">LOGIN</button>
            <button onClick={() => navigate('/signup')} className="btn-neon-solid">GET ACCESS</button>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center text-center pt-20 pb-16 px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-mono"
            style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            AI-Powered Personalized Learning
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black mb-5 leading-tight">
            <span style={{ color: '#e2e8f0' }}>Bridge your skill gap.</span>
            <br />
            <span className="neon-text-cyan">Accelerate your career.</span>
          </h1>

          <p className="text-base font-body font-medium text-gray-400 max-w-xl mb-3 leading-relaxed">
            SkillForge analyzes your resume against your dream job description,
            builds a personalized learning pathway, and gates your progress with
            AI-generated quizzes.
          </p>
        

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/signup')} className="btn-neon-solid text-base px-8 py-3">
              START YOUR JOURNEY →
            </button>
            <button onClick={() => navigate('/dashboard?demo=true', { replace: true })}
              className="btn-neon-cyan text-base px-8 py-3"
              onClickCapture={() => {
                const url = new URL(window.location)
                url.searchParams.set('demo', 'true')
                window.history.pushState({}, '', url)
                navigate('/dashboard')
              }}>
              VIEW DEMO DASHBOARD
            </button>
          </div>
        </section>

        {/* Features grid */}
        <section className="px-8 pb-20 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-gray-200">EVERYTHING YOU NEED</h2>
            <p className="text-xs font-mono text-gray-600 mt-1">AI-powered tools to close your skill gap faster</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.hex} className="glass-card p-5 transition-all duration-300 group"
                style={{ borderColor: `${f.color}20` }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${f.color}15, 0 0 1px ${f.color}30`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                <div className="hex-id mb-2">{f.hex}</div>
                <h3 className="font-body font-bold text-gray-100 mb-2" style={{ color: f.color }}>{f.title}</h3>
                <p className="text-xs font-mono text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t" style={{ borderColor: 'rgba(15,32,64,0.6)' }}>
          <p className="text-xs font-mono text-gray-700">
            SKILLFORGE · AI-Powered Personalized Learning · Built for ambitious learners
          </p>
        </footer>
      </div>
    </div>
  )
}
