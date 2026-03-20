import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { usePathwayStore } from '../store/pathwayStore'
import { demoPathway, demoSkillProfile } from '../data/demoProfile'

const REMOTE_OK_JOBS = [
  { id: 1, title: 'Senior Full-Stack Engineer', company: 'Stripe', salary: '$180k-$220k', tags: ['React', 'TypeScript', 'AWS'] },
  { id: 2, title: 'Backend Engineer - Platform', company: 'Notion', salary: '$160k-$200k', tags: ['Python', 'Kubernetes', 'PostgreSQL'] },
  { id: 3, title: 'ML Engineer', company: 'Scale AI', salary: '$170k-$210k', tags: ['PyTorch', 'Docker', 'FastAPI'] },
  { id: 4, title: 'DevOps Engineer', company: 'Linear', salary: '$140k-$180k', tags: ['AWS', 'Terraform', 'Kubernetes'] },
  { id: 5, title: 'Frontend Engineer - React', company: 'Figma', salary: '$160k-$195k', tags: ['React', 'TypeScript', 'GraphQL'] },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1) // 1 = resume, 2 = JD
  const [resumeFile, setResumeFile] = useState(null)
  const [jdTab, setJdTab] = useState('paste') // paste | upload | remotejob
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)
  const jdFileRef = useRef(null)
  const navigate = useNavigate()
  const { isDemo } = useAuthStore()
  const { setPathway, setSkillProfile } = usePathwayStore()

  function handleResumeDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') setResumeFile(file)
  }

  async function handleAnalyze() {
    setLoading(true)

    // Demo mode shortcut
    if (isDemo) {
      setTimeout(() => {
        setPathway(demoPathway)
        setSkillProfile(demoSkillProfile)
        navigate('/analyzing')
      }, 500)
      return
    }

    try {
      // ── Step 1: Upload resume, get resume_file_id ──────────────────────
      setLoadingStatus('Uploading resume...')
      const resumeForm = new FormData()
      resumeForm.append('file', resumeFile)
      const resumeRes = await api.post('/api/upload/resume', resumeForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const resumeFileId = resumeRes.data.file_id

      // ── Step 2: Upload / resolve JD, get jd_file_id ───────────────────
      setLoadingStatus('Processing job description...')
      let jdFileId = null

      if (jdTab === 'paste') {
        // Send JD text as a plain-text file upload
        const blob = new Blob([jdText], { type: 'text/plain' })
        const jdForm = new FormData()
        jdForm.append('file', blob, 'job_description.txt')
        const jdRes = await api.post('/api/upload/jd', jdForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        jdFileId = jdRes.data.file_id

      } else if (jdTab === 'upload' && jdFile) {
        const jdForm = new FormData()
        jdForm.append('file', jdFile)
        const jdRes = await api.post('/api/upload/jd', jdForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        jdFileId = jdRes.data.file_id

      } else if (jdTab === 'remotejob' && selectedJob) {
        // Remote jobs are already known to the backend — pass id directly
        jdFileId = null  // will send jd_id instead
      }

      // ── Step 3: Kick off analysis with IDs only (JSON body) ───────────
      setLoadingStatus('Analyzing skill gap...')
      const analyzePayload =
        jdTab === 'remotejob' && selectedJob
          ? { resume_id: resumeFileId, jd_id: selectedJob.id }
          : { resume_id: resumeFileId, jd_file_id: jdFileId }

      const analyzeRes = await api.post('/api/analyze', analyzePayload)
      navigate(`/analyzing?job_id=${analyzeRes.data.job_id}`)

    } catch (err) {
      console.error('Analyze error:', err)
      setLoadingStatus('Error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canAnalyze = resumeFile && (
    (jdTab === 'paste' && jdText.trim().length > 50) ||
    (jdTab === 'upload' && jdFile) ||
    (jdTab === 'remotejob' && selectedJob)
  )

  return (
    <AppLayout>
      <div className="min-h-full p-6 flex items-start justify-center">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <div className="hex-id mb-1">STEP {step}/2</div>
            <h1 className="font-display text-2xl font-bold neon-text-cyan">
              {step === 1 ? 'UPLOAD RESUME' : 'TARGET ROLE'}
            </h1>
            <p className="text-sm font-mono text-gray-500 mt-1">
              {step === 1 ? '// PyMuPDF extraction → spaCy + O*NET cosine matching' : '// Paste JD · upload PDF · or pick from RemoteOK'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-8">
            {[1, 2].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold transition-all"
                  style={{
                    background: step >= s ? 'rgba(0,245,255,0.1)' : 'rgba(6,14,31,0.8)',
                    border: `1px solid ${step >= s ? 'rgba(0,245,255,0.5)' : 'rgba(15,32,64,0.8)'}`,
                    color: step >= s ? '#00f5ff' : '#374151',
                    boxShadow: step === s ? '0 0 15px rgba(0,245,255,0.2)' : 'none',
                  }}>
                  {s}
                </div>
                {i < 1 && <div className="w-16 h-px mx-2" style={{ background: step > 1 ? 'rgba(0,245,255,0.4)' : 'rgba(15,32,64,0.8)' }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="glass-card-cyan p-6 rounded-lg">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleResumeDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300"
                style={{
                  borderColor: dragOver ? 'rgba(0,245,255,0.6)' : resumeFile ? 'rgba(0,255,136,0.5)' : 'rgba(15,32,64,0.8)',
                  background: dragOver ? 'rgba(0,245,255,0.04)' : resumeFile ? 'rgba(0,255,136,0.03)' : 'rgba(6,14,31,0.4)',
                  boxShadow: dragOver ? '0 0 30px rgba(0,245,255,0.15)' : 'none',
                }}>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                  onChange={e => setResumeFile(e.target.files[0])} />

                {resumeFile ? (
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p className="font-mono text-sm" style={{ color: '#00ff88' }}>{resumeFile.name}</p>
                    <p className="text-xs font-mono text-gray-600 mt-1">{(resumeFile.size / 1024).toFixed(1)} KB · PDF</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                    </div>
                    <p className="font-mono text-sm text-gray-400">DROP RESUME PDF HERE</p>
                    <p className="text-xs font-mono text-gray-600 mt-1">or click to browse · PDF only</p>
                  </div>
                )}
              </div>

              <button onClick={() => setStep(2)} disabled={!resumeFile}
                className="btn-neon-solid w-full py-3 mt-5 disabled:opacity-40 disabled:cursor-not-allowed">
                NEXT: SET TARGET ROLE →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="glass-card-cyan p-6 rounded-lg space-y-5">
              {/* JD Tabs */}
              <div className="flex gap-1 p-1 rounded" style={{ background: 'rgba(6,14,31,0.6)', border: '1px solid rgba(15,32,64,0.8)' }}>
                {[
                  { id: 'paste', label: 'PASTE JD' },
                  { id: 'upload', label: 'UPLOAD PDF' },
                  { id: 'remotejob', label: 'REMOTE OK' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setJdTab(tab.id)}
                    className="flex-1 py-2 rounded text-xs font-mono font-bold transition-all"
                    style={{
                      background: jdTab === tab.id ? 'rgba(0,245,255,0.1)' : 'transparent',
                      color: jdTab === tab.id ? '#00f5ff' : '#4b5563',
                      border: jdTab === tab.id ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {jdTab === 'paste' && (
                <textarea
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="// Paste job description here...&#10;&#10;Senior Full-Stack Engineer&#10;We are looking for..."
                  className="neon-input w-full h-48 resize-none font-mono text-xs leading-relaxed"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                />
              )}

              {jdTab === 'upload' && (
                <div onClick={() => jdFileRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: jdFile ? 'rgba(0,255,136,0.5)' : 'rgba(15,32,64,0.8)',
                    background: jdFile ? 'rgba(0,255,136,0.03)' : 'rgba(6,14,31,0.4)',
                  }}>
                  <input ref={jdFileRef} type="file" accept=".pdf,.txt" className="hidden"
                    onChange={e => setJdFile(e.target.files[0])} />
                  {jdFile
                    ? <p className="font-mono text-sm text-green-400">{jdFile.name}</p>
                    : <p className="font-mono text-sm text-gray-600">Click to upload JD (PDF or TXT)</p>
                  }
                </div>
              )}

              {jdTab === 'remotejob' && (
                <div className="space-y-2">
                  <p className="text-xs font-mono text-gray-600">// RemoteOK public API · live listings</p>
                  {REMOTE_OK_JOBS.map(job => (
                    <div key={job.id} onClick={() => setSelectedJob(job)}
                      className="p-3 rounded cursor-pointer transition-all"
                      style={{
                        background: selectedJob?.id === job.id ? 'rgba(0,245,255,0.06)' : 'rgba(6,14,31,0.6)',
                        border: `1px solid ${selectedJob?.id === job.id ? 'rgba(0,245,255,0.4)' : 'rgba(15,32,64,0.8)'}`,
                      }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-body font-semibold text-sm text-gray-200">{job.title}</p>
                          <p className="text-xs font-mono text-gray-500 mt-0.5">{job.company} · {job.salary}</p>
                        </div>
                        {selectedJob?.id === job.id && (
                          <span className="text-xs font-mono" style={{ color: '#00f5ff' }}>SELECTED</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 text-xs font-mono rounded"
                            style={{ background: 'rgba(0,102,255,0.08)', color: '#60a5fa', border: '1px solid rgba(0,102,255,0.2)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading status */}
              {loading && loadingStatus && (
                <div className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)' }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00f5ff' }} />
                  <span className="text-xs font-mono" style={{ color: '#00f5ff' }}>{loadingStatus}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} disabled={loading}
                  className="btn-neon-blue flex-1 py-3 disabled:opacity-40">
                  ← BACK
                </button>
                <button onClick={handleAnalyze} disabled={!canAnalyze || loading}
                  className="btn-neon-solid flex-[2] py-3 disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? 'INITIALIZING...' : 'ANALYZE SKILL GAP →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
