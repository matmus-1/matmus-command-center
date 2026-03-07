import { useState } from 'react'

const EVENT_ICONS = {
  heartbeat: { icon: '♥', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  status_change: { icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  cron_run: { icon: '⏱', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  error: { icon: '✕', color: 'text-red-400', bg: 'bg-red-500/15' },
  deployment: { icon: '🚀', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  deploy: { icon: '🚀', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  restart: { icon: '↻', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  backup: { icon: '💾', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  maintenance: { icon: '🔧', color: 'text-zinc-400', bg: 'bg-zinc-500/15' },
  update: { icon: '↑', color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
  alert: { icon: '⚠', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  if (isToday) return time
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${time}`
}

function EventRow({ event }) {
  const config = EVENT_ICONS[event.event_type] || { icon: '•', color: 'text-zinc-400', bg: 'bg-zinc-500/15' }
  const agentName = event.agents?.name || event.agent_id || event.source || 'system'
  const details = event.details || {}

  let summary = event.event_type
  if (details.message) summary = details.message
  else if (event.event_type === 'heartbeat') summary = 'Heartbeat received'
  else if (event.event_type === 'status_change') summary = `Status → ${details.new_status || 'unknown'}`
  else if (event.event_type === 'cron_run') summary = `Cron: ${details.cron_name || 'unknown'}`
  else if (event.event_type === 'error') summary = details.error || 'Error occurred'

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 hover:bg-zinc-800/30 rounded transition-colors group">
      <div className={`${config.bg} w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <span className={`${config.color} text-sm`}>{config.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-300 text-sm font-medium truncate">{agentName}</span>
          <span className="text-zinc-600 text-xs font-mono">{formatTime(event.created_at)}</span>
        </div>
        <p className="text-zinc-500 text-xs mt-0.5 truncate">{summary}</p>
      </div>
    </div>
  )
}

export default function ActivityTimeline({ activity, systemEvents }) {
  const [filter, setFilter] = useState('all')
  const [showSystem, setShowSystem] = useState(true)

  // Merge agent activity and system events into one timeline
  const merged = [
    ...(activity || []).map(a => ({ ...a, _source: 'agent' })),
    ...(showSystem && systemEvents ? systemEvents.map(e => ({ ...e, _source: 'system' })) : []),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const filtered = filter === 'all'
    ? merged
    : merged.filter(e => e.event_type === filter)

  const eventTypes = [...new Set(merged.map(e => e.event_type))]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-200">Activity Timeline</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSystem(!showSystem)}
            className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
              showSystem ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800/50 text-zinc-500'
            }`}
          >
            system
          </button>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 font-mono"
          >
            <option value="all">all events</option>
            {eventTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-zinc-600 py-8 text-sm">No events yet</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filtered.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
