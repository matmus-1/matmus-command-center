import { useState, useEffect, useMemo } from 'react'
import { fetchTokenUsage, subscribeTokenUsage } from '../lib/supabase'

function formatTokens(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatCost(n) {
  if (!n) return '$0.00'
  return `$${n.toFixed(4)}`
}

function TokenChart({ dailyData }) {
  if (!dailyData || dailyData.length === 0) return null

  const maxTokens = Math.max(...dailyData.map(d => d.total), 1)
  const chartH = 160
  const chartW = 600
  const barW = Math.min(40, (chartW - 40) / dailyData.length - 4)
  const startX = 40

  return (
    <div className="rounded-lg border p-4 mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">7-Day Token Usage</div>
      <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full" style={{ maxHeight: '220px' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <g key={pct}>
            <line x1={startX} y1={chartH * (1 - pct)} x2={chartW} y2={chartH * (1 - pct)} stroke="#1e2030" strokeWidth={0.5} />
            <text x={startX - 4} y={chartH * (1 - pct) + 3} textAnchor="end" fill="#3f3f46" fontSize="8" fontFamily="monospace">
              {formatTokens(maxTokens * pct)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {dailyData.map((d, i) => {
          const x = startX + i * ((chartW - startX) / dailyData.length) + 2
          const barH = (d.total / maxTokens) * chartH
          const inputH = (d.input / maxTokens) * chartH
          const outputH = (d.output / maxTokens) * chartH
          const cacheH = barH - inputH - outputH

          return (
            <g key={d.date}>
              {/* Cache portion */}
              <rect x={x} y={chartH - barH} width={barW} height={Math.max(0, cacheH)} rx={2} fill="#3b82f6" opacity={0.3} />
              {/* Input portion */}
              <rect x={x} y={chartH - inputH - outputH} width={barW} height={inputH} rx={0} fill="#34d399" opacity={0.6} />
              {/* Output portion */}
              <rect x={x} y={chartH - outputH} width={barW} height={outputH} rx={2} fill="#a78bfa" opacity={0.6} />
              {/* Date label */}
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">
                {d.label}
              </text>
              {/* Total on hover area */}
              <title>{`${d.date}: ${formatTokens(d.total)} tokens`}</title>
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[9px] font-mono text-zinc-500">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-400/60" /> input</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-purple-400/60" /> output</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-400/30" /> cache</div>
      </div>
    </div>
  )
}

function AgentBreakdown({ agentStats }) {
  if (!agentStats || agentStats.length === 0) return null
  const maxTokens = Math.max(...agentStats.map(a => a.total), 1)

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Per-Agent Breakdown</span>
      </div>
      {agentStats.map(agent => (
        <div key={agent.name} className="px-4 py-3 border-b hover:bg-white/[0.02]" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-zinc-200 font-medium">{agent.name}</span>
            <span className="text-xs font-mono text-zinc-400">{formatTokens(agent.total)}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-emerald-400/60 rounded-full transition-all" style={{ width: `${(agent.total / maxTokens) * 100}%` }} />
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
            <span>{agent.runs} runs</span>
            <span>avg {formatTokens(Math.round(agent.total / (agent.runs || 1)))}/run</span>
            <span>{formatCost(agent.cost)}</span>
            <span className="text-zinc-500">{agent.model}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TokenAnalytics() {
  const [tokenData, setTokenData] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    fetchTokenUsage(days).then(data => { setTokenData(data || []); setLoading(false) }).catch(() => setLoading(false))
    const sub = subscribeTokenUsage(() => fetchTokenUsage(days).then(data => setTokenData(data || [])))
    return () => sub?.unsubscribe?.()
  }, [days])

  // Aggregate stats
  const stats = useMemo(() => {
    const totalTokens = tokenData.reduce((sum, r) => sum + (r.total_tokens || 0), 0)
    const totalCost = tokenData.reduce((sum, r) => sum + (r.metadata?.cost_usd || 0), 0)
    const totalRuns = tokenData.length

    // Daily breakdown for chart
    const byDay = {}
    tokenData.forEach(r => {
      const day = r.created_at?.split('T')[0] || 'unknown'
      if (!byDay[day]) byDay[day] = { total: 0, input: 0, output: 0, runs: 0 }
      byDay[day].total += r.total_tokens || 0
      byDay[day].input += r.input_tokens || 0
      byDay[day].output += r.output_tokens || 0
      byDay[day].runs++
    })

    const dailyData = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, d]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-GB', { weekday: 'short' }),
        ...d,
      }))

    // Per-agent stats
    const byAgent = {}
    tokenData.forEach(r => {
      const name = r.agent_name || r.agent_id || 'unknown'
      if (!byAgent[name]) byAgent[name] = { name, total: 0, runs: 0, cost: 0, model: r.model_used || '' }
      byAgent[name].total += r.total_tokens || 0
      byAgent[name].runs++
      byAgent[name].cost += r.metadata?.cost_usd || 0
      if (r.model_used) byAgent[name].model = r.model_used
    })
    const agentStats = Object.values(byAgent).sort((a, b) => b.total - a.total)

    return { totalTokens, totalCost, totalRuns, dailyData, agentStats }
  }, [tokenData])

  if (loading) return <div className="text-zinc-500 text-sm font-mono py-8 text-center">Loading token data...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-200">Token Analytics</h2>
        <div className="flex items-center gap-1 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-[10px] font-mono transition-colors ${days === d ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-400'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Total Tokens</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">{formatTokens(stats.totalTokens)}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Total Cost</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{formatCost(stats.totalCost)}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Sessions</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">{stats.totalRuns}</div>
        </div>
      </div>

      <TokenChart dailyData={stats.dailyData} />
      <AgentBreakdown agentStats={stats.agentStats} />
    </div>
  )
}
