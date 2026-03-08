function HealthBar({ agents }) {
  const total = agents?.length || 1
  const active = agents?.filter(a => a.status === 'active').length || 0
  const idle = agents?.filter(a => a.status === 'idle').length || 0
  const degraded = agents?.filter(a => a.status === 'degraded').length || 0
  const errors = agents?.filter(a => a.status === 'error').length || 0

  const greenPct = ((active + idle) / total) * 100
  const amberPct = (degraded / total) * 100
  const redPct = (errors / total) * 100

  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Fleet Health</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-zinc-800/50 flex">
        {greenPct > 0 && (
          <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${greenPct}%` }} />
        )}
        {amberPct > 0 && (
          <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${amberPct}%` }} />
        )}
        {redPct > 0 && (
          <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${redPct}%` }} />
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      className="flex-1 rounded-lg border px-4 py-3 transition-all hover:border-opacity-60"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm ${color || 'text-zinc-500'}`}>{icon}</span>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-2xl font-bold text-zinc-200 font-mono">{value}</span>
    </div>
  )
}

function MetricBar({ label, value }) {
  const pct = Math.min(value, 100)
  const color = pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div
      className="flex-1 rounded-lg border px-4 py-3"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase">{label}</span>
        <span className="text-xs font-mono text-zinc-400">{value}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function SummaryCards({ agents, pendingApprovals = 0 }) {
  const total = agents?.length || 0
  const healthy = agents?.filter(a => a.status === 'active' || a.status === 'idle').length || 0
  const degraded = agents?.filter(a => a.status === 'degraded').length || 0
  const errors = agents?.filter(a => a.status === 'error').length || 0

  // Get system metrics from agent with metadata
  const metricsAgent = agents?.find(a => a.metadata?.cpu_percent !== undefined)
  const cpu = metricsAgent?.metadata?.cpu_percent || 0
  const ram = metricsAgent?.metadata?.mem_percent || metricsAgent?.metadata?.ram_percent || 0
  const disk = metricsAgent?.metadata?.disk_percent || 0

  return (
    <div>
      <HealthBar agents={agents} />

      <div className={`grid ${pendingApprovals > 0 ? 'grid-cols-5' : 'grid-cols-4'} gap-3 mb-4`}>
        <StatCard icon="⬡" label="Total Agents" value={total} color="text-emerald-400" />
        <StatCard icon="✓" label="Healthy" value={healthy} color="text-emerald-400" />
        <StatCard icon="⚠" label="Degraded" value={degraded} color="text-amber-400" />
        <StatCard icon="✕" label="Errors" value={errors} color="text-red-400" />
        {pendingApprovals > 0 && (
          <StatCard icon="◉" label="Approvals" value={pendingApprovals} color="text-yellow-400" />
        )}
      </div>

      {metricsAgent && (
        <div className="grid grid-cols-3 gap-3">
          <MetricBar label="CPU" value={cpu} />
          <MetricBar label="RAM" value={ram} />
          <MetricBar label="Disk" value={disk} />
        </div>
      )}
    </div>
  )
}
