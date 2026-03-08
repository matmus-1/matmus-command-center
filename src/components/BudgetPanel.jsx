import { useState, useEffect } from 'react'
import { fetchAgentBudgets, updateAgentBudget } from '../lib/supabase'

function budgetStatus(spend, limit) {
  if (!limit) return { label: 'UNLIMITED', color: 'text-zinc-500', bar: 'bg-zinc-600', pct: 0 }
  const pct = (spend / limit) * 100
  if (pct >= 100) return { label: 'EXCEEDED', color: 'text-red-400', bar: 'bg-red-400', pct: 100 }
  if (pct >= 80) return { label: 'CRITICAL', color: 'text-red-400', bar: 'bg-red-400', pct }
  if (pct >= 60) return { label: 'HIGH', color: 'text-amber-400', bar: 'bg-amber-400', pct }
  return { label: 'OK', color: 'text-emerald-400', bar: 'bg-emerald-400', pct }
}

export default function BudgetPanel() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const loadBudgets = () => {
    fetchAgentBudgets()
      .then(data => setBudgets(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBudgets() }, [])

  const handleSave = async (agentId) => {
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) return
    try {
      await updateAgentBudget(agentId, val === 0 ? null : val)
      setEditingId(null)
      loadBudgets()
    } catch (err) {
      console.error('Failed to update budget:', err)
    }
  }

  if (loading) return null

  return (
    <div className="rounded-lg border overflow-hidden mt-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Monthly Budgets</span>
      </div>

      {budgets.map(b => {
        const spend = parseFloat(b.current_month_spend) || 0
        const limit = b.monthly_budget_usd ? parseFloat(b.monthly_budget_usd) : null
        const st = budgetStatus(spend, limit)

        return (
          <div key={b.id} className="px-4 py-3 border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-zinc-200 font-medium">{b.name}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono font-semibold ${st.color}`}>{st.label}</span>
                <span className="text-xs font-mono text-zinc-400">
                  ${spend.toFixed(2)} {limit ? `/ $${limit.toFixed(2)}` : ''}
                </span>
              </div>
            </div>

            {limit && (
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${st.bar}`}
                  style={{ width: `${Math.min(st.pct, 100)}%` }}
                />
              </div>
            )}

            {editingId === b.id ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono text-zinc-600">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave(b.id)}
                  className="bg-zinc-900/50 border rounded px-2 py-1 text-[11px] text-zinc-200 font-mono w-24 focus:outline-none focus:border-emerald-500/50"
                  style={{ borderColor: 'var(--border)' }}
                  autoFocus
                />
                <button
                  onClick={() => handleSave(b.id)}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-[10px] font-mono px-2 py-1 rounded text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  Cancel
                </button>
                {limit && (
                  <button
                    onClick={async () => {
                      await updateAgentBudget(b.id, null)
                      setEditingId(null)
                      loadBudgets()
                    }}
                    className="text-[10px] font-mono px-2 py-1 rounded text-red-400 hover:text-red-300 transition-colors ml-auto"
                  >
                    Remove limit
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setEditingId(b.id); setEditValue(limit?.toString() || '') }}
                className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
              >
                {limit ? 'Edit limit' : '+ Set budget'}
              </button>
            )}
          </div>
        )
      })}

      {budgets.length === 0 && (
        <div className="text-center text-zinc-600 py-6 text-sm font-mono">No agents found</div>
      )}
    </div>
  )
}
