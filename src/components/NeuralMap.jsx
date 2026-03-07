import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const STATUS_COLORS = {
  active: '#34d399',
  degraded: '#fbbf24',
  idle: '#60a5fa',
  error: '#f87171',
}

const RELATIONSHIP_STYLES = {
  delegates_to: { stroke: '#a78bfa', label: 'delegates', animated: true },
  monitors: { stroke: '#34d399', label: 'monitors', animated: false },
  reports_to: { stroke: '#60a5fa', label: 'reports', animated: false },
  fallback: { stroke: '#f97316', label: 'fallback', animated: true },
  shares_workspace: { stroke: '#6b7280', label: 'shares', animated: false },
}

function AgentNode({ data }) {
  const color = STATUS_COLORS[data.status] || STATUS_COLORS.idle

  return (
    <div
      className="relative px-5 py-4 rounded-xl border-2 bg-zinc-900/95 backdrop-blur shadow-xl min-w-[160px]"
      style={{ borderColor: color }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-20 blur-md -z-10"
        style={{ backgroundColor: color }}
      />

      {/* Status dot */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
        <span className="text-white font-semibold text-sm">{data.label}</span>
      </div>

      {/* Model */}
      <div className="text-zinc-500 text-[10px] font-mono truncate">{data.model}</div>

      {/* Channels */}
      {data.channels && data.channels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.channels.slice(0, 3).map(ch => (
            <span
              key={ch}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
            >
              {ch}
            </span>
          ))}
          {data.channels.length > 3 && (
            <span className="text-[9px] font-mono text-zinc-600">+{data.channels.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}

const nodeTypes = { agentNode: AgentNode }

export default function NeuralMap({ agents, relationships }) {
  // Build nodes from agents
  const initialNodes = useMemo(() => {
    if (!agents || agents.length === 0) return []

    // Circular layout
    const centerX = 400
    const centerY = 250
    const radius = 180

    return agents.map((agent, i) => {
      const angle = (2 * Math.PI * i) / agents.length - Math.PI / 2
      return {
        id: agent.id,
        type: 'agentNode',
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: {
          label: agent.name,
          status: agent.status,
          model: agent.model,
          channels: agent.channels,
        },
      }
    })
  }, [agents])

  // Build edges from relationships
  const initialEdges = useMemo(() => {
    if (!relationships || relationships.length === 0) return []

    return relationships.map(rel => {
      const style = RELATIONSHIP_STYLES[rel.relationship_type] || RELATIONSHIP_STYLES.shares_workspace
      return {
        id: rel.id,
        source: rel.source_agent_id,
        target: rel.target_agent_id,
        animated: style.animated,
        label: style.label,
        labelStyle: { fill: '#71717a', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#18181b', fillOpacity: 0.9 },
        labelBgPadding: [4, 2],
        style: { stroke: style.stroke, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: style.stroke,
          width: 16,
          height: 16,
        },
      }
    })
  }, [relationships])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when agents change
  useMemo(() => {
    if (initialNodes.length > 0 && nodes.length === 0) {
      setNodes(initialNodes)
    }
  }, [initialNodes])

  useMemo(() => {
    if (initialEdges.length > 0 && edges.length === 0) {
      setEdges(initialEdges)
    }
  }, [initialEdges])

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-12">
        <p>No topology data available</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-4">Neural Command Map</h2>
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden" style={{ height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-zinc-800 !border-zinc-700 !rounded-lg !shadow-xl [&_button]:!bg-zinc-800 [&_button]:!border-zinc-700 [&_button]:!text-zinc-400 [&_button:hover]:!bg-zinc-700"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-500">
        {Object.entries(RELATIONSHIP_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: val.stroke }} />
            <span className="font-mono">{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
