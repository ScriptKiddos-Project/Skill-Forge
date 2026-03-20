import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function ProgressDonut({ value = 75, label = 'BATCH RATE', size = 'md' }) {
  const data = [
    { value },
    { value: 100 - value },
  ]

  const colors = {
    fill: value >= 70 ? '#00f5ff' : value >= 40 ? '#fbbf24' : '#f87171',
    glow: value >= 70 ? 'rgba(0,245,255,0.4)' : value >= 40 ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)',
  }

  const dim = size === 'sm' ? 80 : size === 'lg' ? 160 : 120
  const inner = size === 'sm' ? 28 : size === 'lg' ? 58 : 42
  const outer = size === 'sm' ? 38 : size === 'lg' ? 74 : 56
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 28 : 20

  return (
    <div className="relative flex flex-col items-center">
      <div style={{ width: dim, height: dim, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={inner}
              outerRadius={outer}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={colors.fill} filter="url(#glow)" />
              <Cell fill="rgba(15,32,64,0.6)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold leading-none"
            style={{ fontSize, color: colors.fill, textShadow: `0 0 15px ${colors.glow}` }}>
            {value}%
          </span>
        </div>
      </div>

      <span className="text-xs font-mono mt-1 tracking-widest"
        style={{ color: 'rgba(0,245,255,0.5)' }}>
        {label}
      </span>
    </div>
  )
}
