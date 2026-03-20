import { useRef, useState } from 'react'

export default function ResumeUpload({ onFile }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const ref = useRef(null)

  function handleFile(f) {
    if (f?.type === 'application/pdf') {
      setFile(f)
      onFile?.(f)
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => ref.current?.click()}
      className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300"
      style={{
        borderColor: dragOver ? 'rgba(0,245,255,0.6)' : file ? 'rgba(0,255,136,0.5)' : 'rgba(15,32,64,0.8)',
        background: dragOver ? 'rgba(0,245,255,0.04)' : file ? 'rgba(0,255,136,0.03)' : 'rgba(6,14,31,0.4)',
        boxShadow: dragOver ? '0 0 30px rgba(0,245,255,0.15)' : 'none',
      }}>
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />

      {file ? (
        <div>
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="1.5" className="w-6 h-6">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
          </div>
          <p className="font-mono text-sm" style={{ color: '#00ff88' }}>{file.name}</p>
          <p className="text-xs font-mono text-gray-600 mt-1">{(file.size / 1024).toFixed(1)} KB · PDF ready</p>
        </div>
      ) : (
        <div>
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="1.5" className="w-6 h-6">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>
          <p className="font-mono text-sm text-gray-400">DROP RESUME PDF</p>
          <p className="text-xs font-mono text-gray-700 mt-1">or click to browse · PDF only · PyMuPDF extraction</p>
        </div>
      )}
    </div>
  )
}
