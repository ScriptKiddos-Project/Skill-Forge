import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  const color = score >= 70 ? '#00ff88' : score >= 40 ? '#fbbf24' : '#f87171'
  return (
    <div className="terminal-panel p-2 rounded text-xs">
      <p className="font-mono font-bold" style={{ color }}>{score}%</p>
      <p className="text-gray-500">{payload[0].payload.topic}</p>
      <p className="text-gray-600">{label}</p>
    </div>
  )
}

export default function ScoreTimeline({ data }) {
  if (!data?.length) return null

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00f5ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(15,32,64,0.6)" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="rgba(0,255,136,0.3)" strokeDasharray="4 4" />
          <ReferenceLine y={40} stroke="rgba(251,191,36,0.3)" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#00f5ff"
            strokeWidth={2}
            fill="url(#scoreGrad)"
            dot={{ fill: '#00f5ff', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#00f5ff', boxShadow: '0 0 10px rgba(0,245,255,0.8)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
