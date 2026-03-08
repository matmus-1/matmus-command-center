import { useState, useEffect, useMemo } from 'react'
import { fetchGoals, createGoal, updateGoal, subscribeGoals, fetchTasks } from '../lib/supabase'

const STATUS_CONFIG = {
  active: { dot: 'bg-blue-400', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  completed: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  archived: { dot: 'bg-zinc-500', text: 'text-zinc-500', bg: 'bg-zinc-500/10' },
}

const PRIORITY_CONFIG = {
  0: { label: 'P0', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  1: { label: 'P1', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  2: { label: 'P2', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  3: { label: 'P3', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
}

const TASK_STATUS_DOT = {
  pending: 'bg-zinc-400',
  running: 'bg-blue-400',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
  cancelled: 'bg-zinc-600',
}

function GoalRow({ goal, tasks, subGoals, isExpanded, onToggle, onStatusChange }) {
  const sc = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active
  const p = PRIORITY_CONFIG[goal.priority] || PRIORITY_CONFIG[2]

  const linkedTasks = tasks.filter(t => t.goal_id === goal.id)
  const completedCount = linkedTasks.filter(t => t.status === 'completed').length
  const totalCount = linkedTasks.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const childGoals = subGoals.filter(g => g.parent_goal_id === goal.id)

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${p.bg} ${p.color} ${p.border} flex-shrink-0`}>
          {p.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-zinc-200 font-medium truncate">{goal.title}</div>
          <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
            {totalCount > 0 ? `${completedCount} of ${totalCount} tasks` : 'No tasks linked'}
            {childGoals.length > 0 ? ` · ${childGoals.length} sub-goals` : ''}
          </div>
        </div>

        {totalCount > 0 && (
          <div className="w-16 flex-shrink-0">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${sc.dot.replace('bg-', 'bg-')}`} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <span className={`text-[9px] font-mono font-semibold uppercase flex-shrink-0 ${sc.text}`}>
          {goal.status}
        </span>
      </div>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          {goal.description && (
            <p className="text-zinc-500 text-[11px] leading-relaxed">{goal.description}</p>
          )}

          {/* Sub-goals */}
          {childGoals.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-zinc-600 mb-1.5">Sub-Goals</div>
              <div className="space-y-1 pl-2 border-l border-zinc-800">
                {childGoals.map(sg => {
                  const sgSc = STATUS_CONFIG[sg.status] || STATUS_CONFIG.active
                  const sgTasks = tasks.filter(t => t.goal_id === sg.id)
                  const sgDone = sgTasks.filter(t => t.status === 'completed').length
                  return (
                    <div key={sg.id} className="flex items-center gap-2 py-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${sgSc.dot}`} />
                      <span className="text-[11px] text-zinc-300 flex-1">{sg.title}</span>
                      {sgTasks.length > 0 && (
                        <span className="text-[10px] font-mono text-zinc-600">{sgDone}/{sgTasks.length}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-zinc-600 mb-1.5">Linked Tasks</div>
              <div className="space-y-1 pl-2 border-l border-zinc-800">
                {linkedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 py-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${TASK_STATUS_DOT[task.status] || 'bg-zinc-400'}`} />
                    <span className="text-[11px] text-zinc-300 flex-1 truncate">{task.title}</span>
                    <span className="text-[10px] font-mono text-zinc-600">{task.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {goal.status === 'active' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(goal.id, 'completed') }}
                className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
              >
                Complete
              </button>
            )}
            {goal.status === 'completed' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(goal.id, 'active') }}
                className="text-[10px] font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
              >
                Reopen
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(goal.id, 'archived') }}
              className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/30 hover:bg-zinc-500/20 transition-colors"
            >
              Archive
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NewGoalForm({ goals, onSubmit, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(2)
  const [parentId, setParentId] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      parent_goal_id: parentId || null,
      status: 'active',
    })
    setTitle('')
    setDescription('')
    setPriority(2)
    setParentId('')
  }

  const topLevelGoals = goals.filter(g => !g.parent_goal_id && g.status === 'active')

  return (
    <div className="rounded-lg border p-4 mb-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">New Goal</div>
      <input
        type="text"
        placeholder="Goal title..."
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
      <div className="flex items-center gap-3">
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

        {topLevelGoals.length > 0 && (
          <select
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            className="bg-zinc-900/50 border rounded px-2 py-1 text-[11px] text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/50"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="">Top-level goal</option>
            {topLevelGoals.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        )}

        <div className="flex-1" />
        <button onClick={onCancel} className="text-[10px] font-mono px-3 py-1 rounded text-zinc-500 hover:text-zinc-400 transition-colors">
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

export default function GoalTracker() {
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [filter, setFilter] = useState('active')

  const loadData = async () => {
    try {
      const [g, t] = await Promise.all([fetchGoals(), fetchTasks()])
      setGoals(g || [])
      setTasks(t || [])
    } catch (err) {
      console.error('Failed to load goals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const sub = subscribeGoals(() => loadData())
    return () => sub?.unsubscribe?.()
  }, [])

  const handleCreate = async (goal) => {
    try {
      await createGoal(goal)
      setShowNewForm(false)
    } catch (err) {
      console.error('Failed to create goal:', err)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateGoal(id, { status })
    } catch (err) {
      console.error('Failed to update goal:', err)
    }
  }

  // Filter: top-level goals only (sub-goals shown inside expanded parents)
  const topLevelGoals = useMemo(() => {
    return goals
      .filter(g => !g.parent_goal_id)
      .filter(g => filter === 'all' || g.status === filter)
  }, [goals, filter])

  const counts = useMemo(() => ({
    active: goals.filter(g => !g.parent_goal_id && g.status === 'active').length,
    completed: goals.filter(g => !g.parent_goal_id && g.status === 'completed').length,
    archived: goals.filter(g => !g.parent_goal_id && g.status === 'archived').length,
  }), [goals])

  if (loading) return <div className="text-zinc-500 text-sm font-mono py-8 text-center">Loading goals...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-200">Goals</h2>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="text-[10px] font-mono px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
        >
          + New Goal
        </button>
      </div>

      {showNewForm && <NewGoalForm goals={goals} onSubmit={handleCreate} onCancel={() => setShowNewForm(false)} />}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-blue-400 uppercase mb-1">Active</div>
          <div className="text-xl font-bold text-blue-400 font-mono">{counts.active}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-emerald-400 uppercase mb-1">Completed</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{counts.completed}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Archived</div>
          <div className="text-xl font-bold text-zinc-500 font-mono">{counts.archived}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 rounded-lg border overflow-hidden w-fit" style={{ borderColor: 'var(--border)' }}>
        {['active', 'completed', 'archived', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[10px] font-mono transition-colors capitalize ${
              filter === f ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Goal list */}
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {topLevelGoals.length === 0 ? (
          <div className="text-center text-zinc-600 py-8 text-sm font-mono">
            {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
          </div>
        ) : (
          topLevelGoals.map(goal => (
            <GoalRow
              key={goal.id}
              goal={goal}
              tasks={tasks}
              subGoals={goals}
              isExpanded={expandedId === goal.id}
              onToggle={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  )
}
