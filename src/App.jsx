import { useState, useEffect, useCallback } from 'react'
import {
  isConfigured,
  fetchAgents,
  fetchActivity,
  fetchRelationships,
  fetchSystemEvents,
  fetchPendingApprovals,
  subscribeAgents,
  subscribeActivity,
  subscribeSystemEvents,
  subscribeTasks,
} from './lib/supabase'
import Sidebar from './components/Sidebar'
import SummaryCards from './components/SummaryCards'
import CommandMap from './components/CommandMap'
import FleetRoster from './components/FleetRoster'
import ActivityTimeline from './components/ActivityTimeline'
import AgentFleet from './components/AgentFleet'
import TaskQueue from './components/TaskQueue'
import GoalTracker from './components/GoalTracker'
import TokenAnalytics from './components/TokenAnalytics'
import CronHealth from './components/CronHealth'
import WorkspaceSync from './components/WorkspaceSync'
import FleetBackup from './components/FleetBackup'

export default function App() {
  const [agents, setAgents] = useState([])
  const [activity, setActivity] = useState([])
  const [relationships, setRelationships] = useState([])
  const [systemEvents, setSystemEvents] = useState([])
  const [activeView, setActiveView] = useState('agents')
  const [viewMode, setViewMode] = useState('command') // grid | neural | command
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-lg">
          <div className="w-3 h-3 rounded-full bg-amber-400 mx-auto mb-4" />
          <p className="text-amber-400 text-sm font-mono mb-2">Missing Configuration</p>
          <p className="text-zinc-500 text-xs font-mono">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.
          </p>
        </div>
      </div>
    )
  }

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [agentsData, activityData, relData, eventsData, approvalsData] = await Promise.all([
        fetchAgents(),
        fetchActivity(100),
        fetchRelationships(),
        fetchSystemEvents(50),
        fetchPendingApprovals().catch(() => []),
      ])
      setAgents(agentsData || [])
      setActivity(activityData || [])
      setRelationships(relData || [])
      setSystemEvents(eventsData || [])
      setPendingApprovals((approvalsData || []).length)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    const agentSub = subscribeAgents((payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        setAgents(prev => {
          const idx = prev.findIndex(a => a.id === payload.new.id)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = payload.new
            return updated
          }
          return [...prev, payload.new]
        })
      }
    })

    const activitySub = subscribeActivity((payload) => {
      if (payload.eventType === 'INSERT') {
        setActivity(prev => [payload.new, ...prev].slice(0, 100))
      }
    })

    const eventsSub = subscribeSystemEvents((payload) => {
      if (payload.eventType === 'INSERT') {
        setSystemEvents(prev => [payload.new, ...prev].slice(0, 50))
      }
    })

    const tasksSub = subscribeTasks(() => {
      fetchPendingApprovals().then(data => setPendingApprovals((data || []).length)).catch(() => {})
    })

    const interval = setInterval(loadData, 60000)

    return () => {
      agentSub?.unsubscribe?.()
      activitySub?.unsubscribe?.()
      eventsSub?.unsubscribe?.()
      tasksSub?.unsubscribe?.()
      clearInterval(interval)
    }
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-mono">Connecting to Supabase...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-md">
          <div className="w-3 h-3 rounded-full bg-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-sm font-mono mb-2">Connection Error</p>
          <p className="text-zinc-500 text-xs font-mono mb-4">{error}</p>
          <button onClick={loadData} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded font-mono transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h1 className="text-lg font-semibold text-zinc-200">Command Center</h1>
            <p className="text-[11px] text-zinc-600">Agent fleet overview and operational status</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">LIVE</span>
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors px-2 py-1 rounded hover:bg-white/[0.03]"
            >
              ↻
            </button>
          </div>
        </div>

        {/* View Content */}
        {activeView === 'agents' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Center area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary Cards */}
              <SummaryCards agents={agents} pendingApprovals={pendingApprovals} />

              {/* Agent Fleet heading + view toggle */}
              <div className="flex items-center justify-between mt-6 mb-4">
                <h2 className="text-base font-semibold text-zinc-200">Agent Fleet</h2>
                <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  {[
                    { id: 'grid', label: '☰ GRID' },
                    { id: 'command', label: '⬡ COMMAND' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      className={`px-3 py-1.5 text-[10px] font-mono transition-colors ${
                        viewMode === mode.id
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.03]'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map or Grid */}
              {viewMode === 'command' ? (
                <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <CommandMap
                    agents={agents}
                    relationships={relationships}
                    selectedAgent={selectedAgent}
                    onSelectAgent={setSelectedAgent}
                  />
                </div>
              ) : (
                <AgentFleet agents={agents} />
              )}
            </div>

            {/* Fleet Roster */}
            <FleetRoster
              agents={agents}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
            />
          </div>
        )}

        {activeView === 'timeline' && (
          <div className="flex-1 overflow-y-auto p-6">
            <ActivityTimeline activity={activity} systemEvents={systemEvents} />
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="flex-1 overflow-y-auto p-6">
            <TaskQueue />
          </div>
        )}

        {activeView === 'goals' && (
          <div className="flex-1 overflow-y-auto p-6">
            <GoalTracker />
          </div>
        )}

        {activeView === 'tokens' && (
          <div className="flex-1 overflow-y-auto p-6">
            <TokenAnalytics />
          </div>
        )}

        {activeView === 'cron' && (
          <div className="flex-1 overflow-y-auto p-6">
            <CronHealth />
          </div>
        )}

        {activeView === 'workspace' && (
          <div className="flex-1 overflow-y-auto p-6">
            <WorkspaceSync />
          </div>
        )}

        {activeView === 'backup' && (
          <div className="flex-1 overflow-y-auto p-6">
            <FleetBackup />
          </div>
        )}

        {activeView === 'events' && (
          <div className="flex-1 overflow-y-auto p-6">
            <ActivityTimeline activity={[]} systemEvents={systemEvents} />
          </div>
        )}
      </div>
    </div>
  )
}
