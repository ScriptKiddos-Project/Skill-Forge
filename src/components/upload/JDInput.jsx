import { useRef, useState } from 'react'

const REMOTE_OK_JOBS = [
  { id: 1, title: 'Senior Full-Stack Engineer', company: 'Stripe', salary: '$180k-$220k', tags: ['React', 'TypeScript', 'AWS'] },
  { id: 2, title: 'Backend Engineer - Platform', company: 'Notion', salary: '$160k-$200k', tags: ['Python', 'Kubernetes', 'PostgreSQL'] },
  { id: 3, title: 'ML Engineer', company: 'Scale AI', salary: '$170k-$210k', tags: ['PyTorch', 'Docker', 'FastAPI'] },
  { id: 4, title: 'DevOps Engineer', company: 'Linear', salary: '$140k-$180k', tags: ['AWS', 'Terraform', 'Kubernetes'] },
]

export default function JDInput({ onChange }) {
  const [tab, setTab] = useState('paste')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [selected, setSelected] = useState(null)
  const ref = useRef(null)

  function notify(val) { onChange?.(val) }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded" style={{ background: 'rgba(6,14,31,0.6)', border: '1px solid rgba(15,32,64,0.8)' }}>
        {[{ id: 'paste', label: 'PASTE JD' }, { id: 'upload', label: 'UPLOAD PDF' }, { id: 'remotejob', label: 'REMOTE OK' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-1.5 rounded text-xs font-mono font-bold transition-all"
            style={{
              background: tab === t.id ? 'rgba(0,245,255,0.1)' : 'transparent',
              color: tab === t.id ? '#00f5ff' : '#4b5563',
              border: tab === t.id ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'paste' && (
        <textarea value={text}
          onChange={e => { setText(e.target.value); notify({ type: 'text', value: e.target.value }) }}
          placeholder="// Paste job description here..."
          className="neon-input w-full h-44 resize-none text-xs leading-relaxed"
          style={{ fontFamily: 'JetBrains Mono, monospace' }} />
      )}

      {tab === 'upload' && (
        <div onClick={() => ref.current?.click()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: file ? 'rgba(0,255,136,0.5)' : 'rgba(15,32,64,0.8)', background: file ? 'rgba(0,255,136,0.03)' : 'rgba(6,14,31,0.4)' }}>
          <input ref={ref} type="file" accept=".pdf,.txt" className="hidden"
            onChange={e => { setFile(e.target.files[0]); notify({ type: 'file', value: e.target.files[0] }) }} />
          {file ? <p className="font-mono text-sm text-green-400">{file.name}</p>
            : <p className="font-mono text-sm text-gray-600">Click to upload JD (PDF or TXT)</p>}
        </div>
      )}

      {tab === 'remotejob' && (
        <div className="space-y-2">
          {REMOTE_OK_JOBS.map(job => (
            <div key={job.id} onClick={() => { setSelected(job); notify({ type: 'remote', value: job }) }}
              className="p-3 rounded cursor-pointer transition-all"
              style={{
                background: selected?.id === job.id ? 'rgba(0,245,255,0.06)' : 'rgba(6,14,31,0.6)',
                border: `1px solid ${selected?.id === job.id ? 'rgba(0,245,255,0.4)' : 'rgba(15,32,64,0.8)'}`,
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-sm text-gray-200">{job.title}</p>
                  <p className="text-xs font-mono text-gray-500">{job.company} · {job.salary}</p>
                </div>
                {selected?.id === job.id && <span className="text-xs font-mono text-cyan-400">SELECTED</span>}
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
    </div>
  )
}
