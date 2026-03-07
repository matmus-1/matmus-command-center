import { useState, useMemo } from 'react'

const STATUS_CONFIG = {
  active: { color: '#34d399', glow: 'rgba(52, 211, 153, 0.4)', label: 'ACTIVE', ring: '#34d399' },
  idle: { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)', label: 'IDLE', ring: '#60a5fa' },
  degraded: { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)', label: 'DEGRADED', ring: '#fbbf24' },
  error: { color: '#f87171', glow: 'rgba(248, 113, 113, 0.4)', label: 'ERROR', ring: '#f87171' },
  unknown: { color: '#71717a', glow: 'rgba(113, 113, 122, 0.3)', label: 'UNKNOWN', ring: '#71717a' },
}

const AGENT_ICONS = {
  'Main Assistant': '🤖',
  'Research Agent': '🔬',
  'Monitor Agent': '📡',
}

function AgentNode({ agent, x, y, isSelected, onSelect }) {
  const config = STATUS_CONFIG[agent.status] || STATUS_CONFIG.unknown
  const icon = AGENT_ICONS[agent.name] || '⬡'

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(agent)}
      style={{ transition: 'transform 0.3s ease' }}
    >
      {/* Outer glow */}
      <circle cx={x} cy={y} r={38} fill="none" stroke={config.color} strokeWidth={isSelected ? 2.5 : 1.5} opacity={isSelected ? 0.8 : 0.3}>
        {agent.status === 'active' && (
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Background circle */}
      <circle cx={x} cy={y} r={30} fill="#141620" stroke={config.ring} strokeWidth={2} />

      {/* Glow effect */}
      <circle cx={x} cy={y} r={30} fill="none" stroke={config.color} strokeWidth={1} opacity={0.2} filter="url(#glow)" />

      {/* Icon */}
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="22" className="select-none">
        {icon}
      </text>

      {/* Name label */}
      <text x={x} y={y + 50} textAnchor="middle" fill="#e4e4e7" fontSize="11" fontWeight="500" fontFamily="inherit">
        {agent.name}
      </text>

      {/* Status badge */}
      <g transform={`translate(${x - 28}, ${y + 56})`}>
        <rect width={56} height={16} rx={4} fill={config.color} opacity={0.15} />
        <rect width={56} height={16} rx={4} fill="none" stroke={config.color} strokeWidth={0.5} opacity={0.4} />
        <text x={28} y={11} textAnchor="middle" fill={config.color} fontSize="8" fontFamily="monospace" fontWeight="600" letterSpacing="0.05em">
          {config.label}
        </text>
      </g>
    </g>
  )
}

function ConnectionLine({ x1, y1, x2, y2, relationship, sourceStatus }) {
  const config = STATUS_CONFIG[sourceStatus] || STATUS_CONFIG.unknown
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={config.color}
        strokeWidth={1}
        opacity={0.15}
        strokeDasharray="4 4"
      >
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="2s" repeatCount="indefinite" />
      </line>
      {/* Subtle glow line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={config.color}
        strokeWidth={2}
        opacity={0.05}
        filter="url(#glow)"
      />
    </g>
  )
}

function CoreNode({ cx, cy }) {
  return (
    <g>
      {/* Outer ring pulse */}
      <circle cx={cx} cy={cy} r={52} fill="none" stroke="#34d399" strokeWidth={1} opacity={0.1}>
        <animate attributeName="r" values="52;58;52" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Middle ring */}
      <circle cx={cx} cy={cy} r={44} fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.2} />

      {/* Core circle */}
      <circle cx={cx} cy={cy} r={36} fill="#0f1117" stroke="#34d399" strokeWidth={2} />

      {/* Inner glow */}
      <circle cx={cx} cy={cy} r={36} fill="none" stroke="#34d399" strokeWidth={1} opacity={0.3} filter="url(#glow)" />

      {/* Core gradient fill */}
      <circle cx={cx} cy={cy} r={34} fill="url(#coreGradient)" opacity={0.3} />

      {/* Label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700" letterSpacing="0.1em" fontFamily="monospace">
        MATMUS
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace" letterSpacing="0.08em">
        NEURAL COMMAND
      </text>
    </g>
  )
}

export default function CommandMap({ agents, relationships, onSelectAgent, selectedAgent }) {
  const viewBox = "0 0 700 500"
  const centerX = 350
  const centerY = 230
  const radius = 160

  // Calculate node positions in a circle
  const agentPositions = useMemo(() => {
    if (!agents || agents.length === 0) return []
    return agents.map((agent, i) => {
      const angle = (2 * Math.PI * i) / agents.length - Math.PI / 2
      return {
        agent,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
    })
  }, [agents])

  if (!agents || agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm font-mono">
        Awaiting agent data...
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: '7/5', maxHeight: '460px' }}>
      <svg viewBox={viewBox} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core gradient */}
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </radialGradient>

          {/* Background gradient */}
          <radialGradient id="bgGlow" cx="50%" cy="46%" r="45%">
            <stop offset="0%" stopColor="#1e2030" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0a0b10" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle background glow */}
        <rect width="700" height="500" fill="url(#bgGlow)" />

        {/* Orbital rings */}
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#1e2030" strokeWidth={1} strokeDasharray="2 6" opacity={0.5} />
        <circle cx={centerX} cy={centerY} r={radius * 0.6} fill="none" stroke="#1e2030" strokeWidth={0.5} strokeDasharray="1 8" opacity={0.3} />

        {/* Connection lines from each agent to core */}
        {agentPositions.map(({ agent, x, y }) => (
          <ConnectionLine
            key={`conn-${agent.id}`}
            x1={x} y1={y}
            x2={centerX} y2={centerY}
            sourceStatus={agent.status}
          />
        ))}

        {/* Relationship lines between agents */}
        {relationships?.map(rel => {
          const source = agentPositions.find(p => p.agent.id === rel.source_agent_id)
          const target = agentPositions.find(p => p.agent.id === rel.target_agent_id)
          if (!source || !target) return null
          return (
            <ConnectionLine
              key={`rel-${rel.id}`}
              x1={source.x} y1={source.y}
              x2={target.x} y2={target.y}
              relationship={rel.relationship_type}
              sourceStatus={source.agent.status}
            />
          )
        })}

        {/* Core node */}
        <CoreNode cx={centerX} cy={centerY} />

        {/* Agent nodes */}
        {agentPositions.map(({ agent, x, y }) => (
          <AgentNode
            key={agent.id}
            agent={agent}
            x={x} y={y}
            isSelected={selectedAgent?.id === agent.id}
            onSelect={onSelectAgent}
          />
        ))}
      </svg>
    </div>
  )
}
