import { useState, useEffect } from 'react'
import { fetchCronJobs, subscribeCronJobs } from '../lib/supabase'

function timeAgo(date) {
  if (!date) return 'never'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function statusColor(job) {
  if (!job.enabled) return { dot: 'bg-zinc-500', text: 'text-zinc-500', bg: 'bg-zinc-500/10', label: 'PAUSED' }
  if (job.consecutive_errors >= 3) return { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/10', label: 'FAILING' }
  if (job.consecutive_errors > 0) return { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10', label: 'WARNING' }
  if (job.last_run_status === 'ok') return { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'HEALTHY' }
  if (job.last_run_status === 'unknown') return { dot: 'bg-zinc-400', text: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'PENDING' }
  return { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10', label: job.last_run_status?.toUpperCase() || 'UNKNOWN' }
}

function CronRow({ job, isExpanded, onToggle }) {
  const sc = statusColor(job)
  const meta = job.metadata || {}
  const durationMs = meta.lastDurationMs

  return (
    <div
      className="border-b cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={{ borderColor: 'var(--border)' }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-200 font-medium truncate">{job.name}</span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${sc.bg} ${sc.text} font-semibold`}>
              {sc.label}
            </span>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
            {job.schedule} {meta.agentId ? `· ${meta.agentId}` : ''}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-mono text-zinc-400">{timeAgo(job.last_run_at)}</div>
          {durationMs && (
            <div className="text-[10px] font-mono text-zinc-600">{(durationMs / 1000).toFixed(1)}s</div>
          )}
        </div>
        {job.consecutive_errors > 0 && (
          <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
            {job.consecutive_errors} err
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t space-y-2 text-xs" style={{ borderColor: 'var(--border)' }}>
          {job.description && (
            <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-3">{job.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-zinc-600">Next run:</span> <span className="text-zinc-400">{timeAgo(job.next_run_at)}</span></div>
            <div><span className="text-zinc-600">Model:</span> <span className="text-zinc-400">{meta.model || '—'}</span></div>
            <div><span className="text-zinc-600">Timeout:</span> <span className="text-zinc-400">{meta.timeoutSeconds || '—'}s</span></div>
            <div><span className="text-zinc-600">Channel:</span> <span className="text-zinc-400">{meta.channel || '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CronHealth() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchCronJobs().then(data => { setJobs(data || []); setLoading(false) }).catch(() => setLoading(false))
    const sub = subscribeCronJobs(() => fetchCronJobs().then(data => setJobs(data || [])))
    return () => sub?.unsubscribe?.()
  }, [])

  const healthy = jobs.filter(j => j.enabled && j.consecutive_errors === 0 && j.last_run_status === 'ok').length
  const warning = jobs.filter(j => j.consecutive_errors > 0 && j.consecutive_errors < 3).length
  const failing = jobs.filter(j => j.consecutive_errors >= 3).length

  if (loading) return <div className="text-zinc-500 text-sm font-mono py-8 text-center">Loading cron data...</div>

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-4">Cron Health</h2>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Total Jobs</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">{jobs.length}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-emerald-400 uppercase mb-1">Healthy</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{healthy}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-amber-400 uppercase mb-1">Warning</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{warning}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-red-400 uppercase mb-1">Failing</div>
          <div className="text-xl font-bold text-red-400 font-mono">{failing}</div>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {jobs.length === 0 ? (
          <div className="text-center text-zinc-600 py-8 text-sm">No cron jobs found</div>
        ) : (
          jobs.map(job => (
            <CronRow
              key={job.id}
              job={job}
              isExpanded={expandedId === job.id}
              onToggle={() => setExpandedId(expandedId === job.id ? null : job.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
