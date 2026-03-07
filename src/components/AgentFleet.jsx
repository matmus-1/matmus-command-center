import { useState } from 'react'

const STATUS_COLORS = {
  active: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  degraded: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', dot: 'bg-amber-400', text: 'text-amber-400' },
  idle: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', dot: 'bg-blue-400', text: 'text-blue-400' },
  error: { bg: 'bg-red-500/15', border: 'border-red-500/40', dot: 'bg-red-400', text: 'text-red-400' },
}

function timeAgo(date) {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function AgentCard({ agent }) {
  const [expanded, setExpanded] = useState(false)
  const colors = STATUS_COLORS[agent.status] || STATUS_COLORS.idle
  const meta = agent.metadata || {}

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-lg p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} animate-pulse`} />
          <h3 className="text-white font-semibold text-base">{agent.name}</h3>
        </div>
        <span className={`${colors.text} text-xs font-mono uppercase tracking-wider`}>
          {agent.status}
        </span>
      </div>

      {/* Model */}
      <div className="mb-3">
        <span className="inline-block bg-zinc-800/80 text-zinc-400 text-xs font-mono px-2 py-0.5 rounded">
          {agent.model}
        </span>
      </div>

      {/* Heartbeat */}
      <div className="text-zinc-500 text-xs font-mono mb-3">
        Last heartbeat: {timeAgo(agent.last_heartbeat)}
      </div>

      {/* Channels */}
      {agent.channels && agent.channels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.channels.map(ch => (
            <span key={ch} className="text-xs bg-zinc-800/60 text-zinc-400 px-2 py-0.5 rounded font-mono">
              {ch}
            </span>
          ))}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-zinc-700/50 space-y-2 text-xs text-zinc-400">
          {meta.description && <p>{meta.description}</p>}
          <p className="font-mono">ID: {agent.id}</p>
          <p className="font-mono">Sandbox: {agent.sandbox_mode || 'off'}</p>
          {agent.tools && agent.tools.length > 0 && (
            <p className="font-mono">Tools: {agent.tools.join(', ')}</p>
          )}
          {meta.system_metrics && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="bg-zinc-900/50 rounded p-2 text-center">
                <div className="text-zinc-500 text-[10px] uppercase">CPU</div>
                <div className="text-zinc-300 font-mono">{meta.system_metrics.cpu_percent}%</div>
              </div>
              <div className="bg-zinc-900/50 rounded p-2 text-center">
                <div className="text-zinc-500 text-[10px] uppercase">RAM</div>
                <div className="text-zinc-300 font-mono">{meta.system_metrics.ram_percent}%</div>
              </div>
              <div className="bg-zinc-900/50 rounded p-2 text-center">
                <div className="text-zinc-500 text-[10px] uppercase">Disk</div>
                <div className="text-zinc-300 font-mono">{meta.system_metrics.disk_percent}%</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AgentFleet({ agents }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-12">
        <p className="text-lg">No agents found</p>
        <p className="text-sm mt-1">Waiting for heartbeat data...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-4">Agent Fleet</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
