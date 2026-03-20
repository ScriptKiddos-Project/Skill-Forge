import { useMemo, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { statusToColor } from '../../lib/utils'

const STATUS_LABELS = {
  complete: 'PASS',
  active: 'ACTIVE',
  revise: 'REVISE',
  retry: 'RETRY',
  locked: 'LOCKED',
}

function SkillNode({ data }) {
  const color = statusToColor(data.status)
  return (
    <div className="px-3 py-2 rounded min-w-[120px] text-center"
      style={{
        background: 'rgba(6,14,31,0.95)',
        border: `1px solid ${color}60`,
        boxShadow: data.status === 'active'
          ? `0 0 20px ${color}40, 0 0 1px ${color}`
          : `0 0 8px ${color}20`,
      }}>
      <div className="text-xs font-mono font-bold" style={{ color }}>{STATUS_LABELS[data.status]}</div>
      <div className="text-xs font-body font-semibold text-gray-200 mt-0.5 leading-tight">{data.label}</div>
      {data.quiz_score !== null && data.quiz_score !== undefined && (
        <div className="text-xs font-mono mt-1" style={{ color }}>
          {Math.round(data.quiz_score * 100)}%
        </div>
      )}
    </div>
  )
}

const nodeTypes = { skill: SkillNode }

export default function SkillDAGGraph({ steps = [] }) {
  const initialNodes = useMemo(() => {
    // Arrange in columns by order
    const cols = 4
    return steps.map((step, i) => ({
      id: step.id,
      type: 'skill',
      position: {
        x: (i % cols) * 200 + 20,
        y: Math.floor(i / cols) * 120 + 20,
      },
      data: {
        label: step.skill,
        status: step.status,
        quiz_score: step.quiz_score,
      },
    }))
  }, [steps])

  const initialEdges = useMemo(() => {
    const edges = []
    for (let i = 0; i < steps.length - 1; i++) {
      const from = steps[i]
      const to = steps[i + 1]
      if (to.status !== 'locked' || from.status === 'complete') {
        edges.push({
          id: `e-${from.id}-${to.id}`,
          source: from.id,
          target: to.id,
          animated: to.status === 'active',
          style: {
            stroke: to.status === 'active'
              ? '#00f5ff'
              : to.status === 'locked'
              ? '#1f2937'
              : statusToColor(from.status),
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: to.status === 'active' ? '#00f5ff' : '#374151',
            width: 12,
            height: 12,
          },
        })
      }
    }
    return edges
  }, [steps])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="w-full h-full rounded overflow-hidden" style={{ background: 'rgba(2,8,23,0.8)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="rgba(0,245,255,0.04)"
          gap={24}
          size={1}
        />
        <Controls
          className="!bg-[#060e1f] !border-[#0f2040] !shadow-none"
          style={{ '--xy-controls-button-background-color': '#060e1f', '--xy-controls-button-color': '#6b7280' }}
        />
        <MiniMap
          nodeColor={(n) => statusToColor(n.data?.status || 'locked')}
          style={{ background: 'rgba(2,8,23,0.9)', border: '1px solid rgba(15,32,64,0.8)' }}
          maskColor="rgba(2,8,23,0.8)"
        />
      </ReactFlow>
    </div>
  )
}
