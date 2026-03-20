const TYPE_ICON = {
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" strokeWidth="0" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  article: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
}

const TYPE_COLOR = {
  video: '#f87171',
  book: '#a78bfa',
  article: '#60a5fa',
  doc: '#34d399',
}

export default function ResourceList({ resources = [], onMarkDone }) {
  if (!resources.length) return (
    <p className="text-gray-600 text-sm font-mono py-4">// No resources loaded yet</p>
  )

  return (
    <div className="space-y-2">
      {resources.map((r, i) => {
        const color = TYPE_COLOR[r.type] || '#6b7280'
        const icon = TYPE_ICON[r.type] || TYPE_ICON.article

        return (
          <div key={r.id || i}
            className="flex items-center gap-3 p-3 rounded transition-all duration-200 group"
            style={{
              background: 'rgba(6,14,31,0.6)',
              border: '1px solid rgba(15,32,64,0.8)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${color}40`}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(15,32,64,0.8)'}
          >
            {/* Type icon */}
            <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
              {icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-semibold text-gray-200 truncate">{r.title}</p>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mt-0.5">
                <span style={{ color }}>{r.type?.toUpperCase()}</span>
                <span>·</span>
                <span>{r.platform}</span>
                <span>·</span>
                <span>{r.duration}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={r.url || '#'} target="_blank" rel="noopener noreferrer"
                className="px-2 py-1 text-xs font-mono rounded transition-all"
                style={{ color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.06)' }}>
                OPEN
              </a>
              {onMarkDone && (
                <button onClick={() => onMarkDone(r.id)}
                  className="px-2 py-1 text-xs font-mono rounded transition-all"
                  style={{ color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.06)' }}>
                  DONE
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
