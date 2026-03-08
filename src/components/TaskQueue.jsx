import { useState, useEffect } from 'react'
import { fetchTasks, createTask, updateTask, subscribeTasks, approveTask, rejectTask, fetchGoals } from '../lib/supabase'

const PRIORITY_CONFIG = {
  0: { label: 'P0', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', name: 'Critical' },
  1: { label: 'P1', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', name: 'High' },
  2: { label: 'P2', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', name: 'Medium' },
  3: { label: 'P3', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', name: 'Low' },
}

const STATUS_CONFIG = {
  pending: { dot: 'bg-zinc-400', text: 'text-zinc-400' },
  running: { dot: 'bg-blue-400', text: 'text-blue-400' },
  completed: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  failed: { dot: 'bg-red-400', text: 'text-red-400' },
  cancelled: { dot: 'bg-zinc-600', text: 'text-zinc-600' },
}

const STATUS_FILTERS = ['all', 'pending', 'running', 'completed', 'failed']

function timeAgo(date) {
  if (!date) return '—'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function TaskRow({ task, isExpanded, onToggle }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[3]
  const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending

  const handleStatusChange = async (e, newStatus) => {
    e.stopPropagation()
    try {
      const updates = { status: newStatus }
      if (newStatus === 'running') updates.dispatched_at = new Date().toISOString()
      if (newStatus === 'completed' || newStatus === 'failed') updates.completed_at = new Date().toISOString()
      await updateTask(task.id, updates)
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  return (
    <div
      className="border-b cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={{ borderColor: 'var(--border)' }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${p.bg} ${p.color} ${p.border} flex-shrink-0`}>
          {p.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-zinc-200 font-medium truncate">{task.title}</span>
            {task.requires_approval && !task.approved_at && (
              <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex-shrink-0">
                APPROVAL
              </span>
            )}
            {task.requires_approval && task.approved_at && (
              <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                APPROVED
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
            {task.agent_id && <span>{task.agent_id}</span>}
            {task.goal_id && <span>{task.agent_id ? ' · ' : ''}goal linked</span>}
          </div>
        </div>
        <span className={`text-[9px] font-mono font-semibold uppercase ${st.text}`}>
          {task.status}
        </span>
        <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">{timeAgo(task.created_at)}</span>
      </div>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          {task.description && (
            <p className="text-zinc-500 text-[11px] leading-relaxed">{task.description}</p>
          )}

          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
            <div><span className="text-zinc-600">Created:</span> <span className="text-zinc-400">{task.created_at ? new Date(task.created_at).toLocaleString() : '—'}</span></div>
            <div><span className="text-zinc-600">Dispatched:</span> <span className="text-zinc-400">{task.dispatched_at ? new Date(task.dispatched_at).toLocaleString() : '—'}</span></div>
            <div><span className="text-zinc-600">Completed:</span> <span className="text-zinc-400">{task.completed_at ? new Date(task.completed_at).toLocaleString() : '—'}</span></div>
          </div>

          {task.payload && (
            <div>
              <div className="text-[10px] font-mono text-zinc-600 mb-1">Payload</div>
              <pre className="text-[10px] font-mono text-zinc-400 bg-zinc-900/50 rounded p-2 overflow-x-auto max-h-32">
                {JSON.stringify(task.payload, null, 2)}
              </pre>
            </div>
          )}

          {task.result && (
            <div>
              <div className="text-[10px] font-mono text-emerald-500 mb-1">Result</div>
              <pre className="text-[10px] font-mono text-zinc-400 bg-zinc-900/50 rounded p-2 overflow-x-auto max-h-32">
                {JSON.stringify(task.result, null, 2)}
              </pre>
            </div>
          )}

          {task.error_message && (
            <div>
              <div className="text-[10px] font-mono text-red-400 mb-1">Error</div>
              <pre className="text-[10px] font-mono text-red-300 bg-red-950/30 rounded p-2 overflow-x-auto">
                {task.error_message}
              </pre>
            </div>
          )}

          {/* Approval buttons */}
          {task.requires_approval && !task.approved_at && task.status === 'pending' && (
            <div className="flex items-center gap-2 pt-1 pb-1">
              <span className="text-[10px] font-mono text-yellow-400">Awaiting approval</span>
              <div className="flex-1" />
              <button
                onClick={async (e) => { e.stopPropagation(); try { await approveTask(task.id) } catch (err) { console.error(err) } }}
                className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={async (e) => { e.stopPropagation(); try { await rejectTask(task.id, 'Rejected from dashboard') } catch (err) { console.error(err) } }}
                className="text-[10px] font-mono px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {/* Action buttons */}
          {(task.status === 'pending' || task.status === 'running') && !(task.requires_approval && !task.approved_at) && (
            <div className="flex items-center gap-2 pt-1">
              {task.status === 'pending' && (
                <button
                  onClick={(e) => handleStatusChange(e, 'running')}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                >
                  Start
                </button>
              )}
              {task.status === 'running' && (
                <button
                  onClick={(e) => handleStatusChange(e, 'completed')}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  Complete
                </button>
              )}
              <button
                onClick={(e) => handleStatusChange(e, 'cancelled')}
                className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/30 hover:bg-zinc-500/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewTaskForm({ onSubmit, onCancel, goals }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(2)
  const [agentId, setAgentId] = useState('')
  const [goalId, setGoalId] = useState('')
  const [requiresApproval, setRequiresApproval] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      agent_id: agentId || null,
      goal_id: goalId || null,
      requires_approval: requiresApproval,
      status: 'pending',
    })
    setTitle('')
    setDescription('')
    setPriority(2)
    setAgentId('')
    setGoalId('')
    setRequiresApproval(false)
  }

  const activeGoals = (goals || []).filter(g => g.status === 'active')

  return (
    <div className="rounded-lg border p-4 mb-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">New Task</div>
      <input
        type="text"
        placeholder="Task title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full bg-zinc-900/50 border rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500/50"
        style={{ borderColor: 'var(--border)' }}
      />
      <textarea
        placeholder="Description (optional)..."
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
        className="w-full bg-zinc-900/50 border rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500/50 resize-none"
        style={{ borderColor: 'var(--border)' }}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map(p => {
            const cfg = PRIORITY_CONFIG[p]
            return (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                  priority === p
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : 'text-zinc-600 border-transparent hover:text-zinc-400'
                }`}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
        <input
          type="text"
          placeholder="Agent ID"
          value={agentId}
          onChange={e => setAgentId(e.target.value)}
          className="bg-zinc-900/50 border rounded px-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-600 font-mono w-28 focus:outline-none focus:border-emerald-500/50"
          style={{ borderColor: 'var(--border)' }}
        />
        {activeGoals.length > 0 && (
          <select
            value={goalId}
            onChange={e => setGoalId(e.target.value)}
            className="bg-zinc-900/50 border rounded px-2 py-1 text-[11px] text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/50"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="">No goal</option>
            {activeGoals.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={e => setRequiresApproval(e.target.checked)}
            className="rounded border-zinc-600"
          />
          <span className="text-[10px] font-mono text-zinc-500">Requires approval</span>
        </label>
        <div className="flex-1" />
        <button
          onClick={onCancel}
          className="text-[10px] font-mono px-3 py-1 rounded text-zinc-500 hover:text-zinc-400 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="text-[10px] font-mono px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
        >
          Create
        </button>
      </div>
    </div>
  )
}

export default function TaskQueue() {
  const [tasks, setTasks] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)

  const loadTasks = async () => {
    try {
      const filters = filter !== 'all' ? { status: filter } : {}
      const [data, goalsData] = await Promise.all([
        fetchTasks(filters),
        fetchGoals().catch(() => []),
      ])
      setTasks(data || [])
      setGoals(goalsData || [])
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
    const sub = subscribeTasks(() => loadTasks())
    return () => sub?.unsubscribe?.()
  }, [filter])

  const handleCreate = async (task) => {
    try {
      await createTask(task)
      setShowNewForm(false)
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  const counts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  }

  if (loading) return <div className="text-zinc-500 text-sm font-mono py-8 text-center">Loading tasks...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-200">Task Queue</h2>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="text-[10px] font-mono px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
        >
          + New Task
        </button>
      </div>

      {showNewForm && <NewTaskForm goals={goals} onSubmit={handleCreate} onCancel={() => setShowNewForm(false)} />}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {Object.entries(counts).map(([status, count]) => {
          const st = STATUS_CONFIG[status]
          return (
            <div key={status} className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className={`text-[10px] font-mono uppercase mb-1 ${st.text}`}>{status}</div>
              <div className={`text-xl font-bold font-mono ${st.text}`}>{count}</div>
            </div>
          )
        })}
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-4 rounded-lg border overflow-hidden w-fit" style={{ borderColor: 'var(--border)' }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-[10px] font-mono transition-colors capitalize ${
              filter === s ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {tasks.length === 0 ? (
          <div className="text-center text-zinc-600 py-8 text-sm font-mono">
            {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
          </div>
        ) : (
          tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              isExpanded={expandedId === task.id}
              onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
