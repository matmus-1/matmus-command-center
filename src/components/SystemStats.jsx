function timeAgo(date) {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 3600 * 24) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / (3600 * 24))}d ago`
}

function StatBox({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 text-xs font-mono">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color || 'text-zinc-200'}`}>{value}</span>
    </div>
  )
}

function MetricBar({ label, value, max = 100, unit = '%' }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className="text-zinc-500 text-[10px] font-mono w-8 uppercase">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-zinc-400 text-[10px] font-mono w-10 text-right">{value}{unit}</span>
    </div>
  )
}

export default function SystemStats({ agents }) {
  const total = agents?.length || 0
  const active = agents?.filter(a => a.status === 'active').length || 0
  const degraded = agents?.filter(a => a.status === 'degraded').length || 0
  const errors = agents?.filter(a => a.status === 'error').length || 0
  const idle = agents?.filter(a => a.status === 'idle').length || 0

  // Get system metrics from the main agent (or first agent with metrics)
  const metricsAgent = agents?.find(a => a.metadata?.system_metrics) || agents?.[0]
  const metrics = metricsAgent?.metadata?.system_metrics

  // Find most recent heartbeat across all agents
  const lastHb = agents?.reduce((latest, a) => {
    if (!a.last_heartbeat) return latest
    if (!latest) return a.last_heartbeat
    return new Date(a.last_heartbeat) > new Date(latest) ? a.last_heartbeat : latest
  }, null)

  return (
    <div className="bg-zinc-900/80 border-b border-zinc-800 px-6 py-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Brand + agent counts */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-200 font-semibold text-sm tracking-wide">MATMUS</span>
            <span className="text-zinc-600 text-xs font-mono">command center</span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          <div className="flex items-center gap-4">
            <StatBox label="agents" value={total} />
            <StatBox label="active" value={active} color="text-emerald-400" />
            {degraded > 0 && <StatBox label="degraded" value={degraded} color="text-amber-400" />}
            {errors > 0 && <StatBox label="errors" value={errors} color="text-red-400" />}
            {idle > 0 && <StatBox label="idle" value={idle} color="text-blue-400" />}
          </div>
        </div>

        {/* Center: System metrics */}
        {metrics && (
          <div className="flex items-center gap-4">
            <MetricBar label="cpu" value={parseFloat(metrics.cpu_percent) || 0} />
            <MetricBar label="ram" value={parseFloat(metrics.ram_percent) || 0} />
            <MetricBar label="disk" value={parseFloat(metrics.disk_percent) || 0} />
          </div>
        )}

        {/* Right: Last heartbeat */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-600 text-xs font-mono">heartbeat:</span>
          <span className="text-zinc-400 text-xs font-mono">{timeAgo(lastHb)}</span>
        </div>
      </div>
    </div>
  )
}
