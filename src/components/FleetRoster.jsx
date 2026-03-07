const STATUS_CONFIG = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'ACTIVE', dot: 'bg-emerald-400' },
  idle: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'IDLE', dot: 'bg-blue-400' },
  degraded: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'DEGRADED', dot: 'bg-amber-400' },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'ERROR', dot: 'bg-red-400' },
  unknown: { color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', label: 'UNKNOWN', dot: 'bg-zinc-400' },
}

const AGENT_ICONS = {
  'Main Assistant': '🤖',
  'Research Agent': '🔬',
  'Monitor Agent': '📡',
}

const AGENT_DESCRIPTIONS = {
  'Main Assistant': 'Primary conversational agent. Handles Discord messages across #general, #briefing, #inbox, and #devops channels.',
  'Research Agent': 'Deep research agent using Opus model. Activated for complex analysis tasks via #research channel.',
  'Monitor Agent': 'Lightweight monitoring agent. Runs automated cron jobs, health checks, and social media posting.',
}

function timeAgo(date) {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function AgentRosterCard({ agent, isSelected, onSelect }) {
  const config = STATUS_CONFIG[agent.status] || STATUS_CONFIG.unknown
  const icon = AGENT_ICONS[agent.name] || '⬡'
  const description = AGENT_DESCRIPTIONS[agent.name] || agent.metadata?.description || ''

  return (
    <div
      onClick={() => onSelect(agent)}
      className={`px-4 py-3 border-b cursor-pointer transition-all ${
        isSelected ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
      }`}
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-zinc-200">{agent.name}</span>
        </div>
        <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${config.bg} ${config.color} ${config.border} border`}>
          {config.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-zinc-500 leading-relaxed mb-2 line-clamp-2">
        {description}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-600">{timeAgo(agent.last_heartbeat)}</span>

        {/* Health indicator dots */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${
                i < 5 ? config.dot : 'bg-zinc-700'
              }`}
              style={{ opacity: i < 5 ? 0.4 + (i * 0.15) : 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Channels */}
      {agent.channels && agent.channels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {agent.channels.map(ch => (
            <span key={ch} className="text-[9px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded">
              #{ch}
            </span>
          ))}
        </div>
      )}

      {/* Model badge */}
      <div className="mt-2">
        <span className="text-[9px] font-mono text-zinc-600 bg-zinc-800/40 px-1.5 py-0.5 rounded">
          {agent.model}
        </span>
      </div>

      {/* Expanded details for selected agent */}
      {isSelected && agent.metadata && (
        <div className="mt-3 pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          {agent.metadata.gateway && (
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-600">Gateway</span>
              <span className="text-zinc-400">{agent.metadata.gateway}</span>
            </div>
          )}
          {agent.metadata.docker && (
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-600">Docker</span>
              <span className="text-zinc-400">{agent.metadata.docker}</span>
            </div>
          )}
          {agent.metadata.uptime_seconds && (
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-600">Uptime</span>
              <span className="text-zinc-400">{Math.floor(agent.metadata.uptime_seconds / 86400)}d {Math.floor((agent.metadata.uptime_seconds % 86400) / 3600)}h</span>
            </div>
          )}
          {agent.metadata.cpu_percent !== undefined && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center bg-zinc-900/50 rounded p-1.5">
                <div className="text-[8px] font-mono text-zinc-600 uppercase">CPU</div>
                <div className="text-[11px] font-mono text-zinc-300">{agent.metadata.cpu_percent}%</div>
              </div>
              <div className="text-center bg-zinc-900/50 rounded p-1.5">
                <div className="text-[8px] font-mono text-zinc-600 uppercase">RAM</div>
                <div className="text-[11px] font-mono text-zinc-300">{agent.metadata.mem_percent || agent.metadata.ram_percent}%</div>
              </div>
              <div className="text-center bg-zinc-900/50 rounded p-1.5">
                <div className="text-[8px] font-mono text-zinc-600 uppercase">Disk</div>
                <div className="text-[11px] font-mono text-zinc-300">{agent.metadata.disk_percent}%</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FleetRoster({ agents, selectedAgent, onSelectAgent }) {
  return (
    <div
      className="w-80 h-full flex flex-col border-l"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Fleet Roster</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">{agents?.length || 0} agents</span>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto">
        {agents?.map(agent => (
          <AgentRosterCard
            key={agent.id}
            agent={agent}
            isSelected={selectedAgent?.id === agent.id}
            onSelect={onSelectAgent}
          />
        ))}
      </div>
    </div>
  )
}
