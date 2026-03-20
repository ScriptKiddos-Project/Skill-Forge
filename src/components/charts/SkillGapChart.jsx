import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'
import { gapToColor } from '../../lib/utils'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="terminal-panel p-3 rounded text-xs"
      style={{ minWidth: 180 }}>
      <p className="font-mono font-bold mb-1" style={{ color: '#00f5ff' }}>{d.skill}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Gap Score</span>
          <span style={{ color: gapToColor(d.gap_score) }} className="font-bold">
            {Math.round(d.gap_score * 100)}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Confidence</span>
          <span className="text-cyan-400 font-bold">{d.confidence}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Category</span>
          <span className="text-purple-400">{d.category}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Priority</span>
          <span className="text-yellow-400">#{d.priority}</span>
        </div>
      </div>
    </div>
  )
}

export default function SkillGapChart({ data }) {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-48 text-gray-600 font-mono text-sm">
      No gap data available
    </div>
  )

  const chartData = data.map(d => ({
    ...d,
    displayName: d.skill.length > 12 ? d.skill.slice(0, 12) + '…' : d.skill,
    value: Math.round(d.gap_score * 100),
  }))

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {chartData.map((d, i) => (
              <linearGradient key={i} id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gapToColor(d.gap_score)} stopOpacity={0.9} />
                <stop offset="100%" stopColor={gapToColor(d.gap_score)} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(15,32,64,0.8)"
            vertical={false}
          />
          <XAxis
            dataKey="displayName"
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: 'rgba(15,32,64,0.8)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,245,255,0.04)' }} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={`url(#bar-${i})`} stroke={gapToColor(d.gap_score)} strokeWidth={1} strokeOpacity={0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
