import { useState, useEffect, useCallback } from 'react'
import {
  fetchAgents,
  fetchActivity,
  fetchRelationships,
  fetchSystemEvents,
  subscribeAgents,
  subscribeActivity,
  subscribeSystemEvents,
} from './lib/supabase'
import SystemStats from './components/SystemStats'
import AgentFleet from './components/AgentFleet'
import ActivityTimeline from './components/ActivityTimeline'
import NeuralMap from './components/NeuralMap'

const TABS = [
  { id: 'fleet', label: 'Agent Fleet' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'map', label: 'Neural Map' },
]

export default function App() {
  const [agents, setAgents] = useState([])
  const [activity, setActivity] = useState([])
  const [relationships, setRelationships] = useState([])
  const [systemEvents, setSystemEvents] = useState([])
  const [activeTab, setActiveTab] = useState('fleet')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initial data fetch
  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [agentsData, activityData, relData, eventsData] = await Promise.all([
        fetchAgents(),
        fetchActivity(100),
        fetchRelationships(),
        fetchSystemEvents(50),
      ])
      setAgents(agentsData)
      setActivity(activityData)
      setRelationships(relData)
      setSystemEvents(eventsData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // Set up real-time subscriptions
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

    // Periodic refresh every 60s as fallback
    const interval = setInterval(loadData, 60000)

    return () => {
      agentSub?.unsubscribe?.()
      activitySub?.unsubscribe?.()
      eventsSub?.unsubscribe?.()
      clearInterval(interval)
    }
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-mono">Connecting to Supabase...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-3 h-3 rounded-full bg-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-sm font-mono mb-2">Connection Error</p>
          <p className="text-zinc-500 text-xs font-mono mb-4">{error}</p>
          <button
            onClick={loadData}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded font-mono transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* System Stats Bar */}
      <SystemStats agents={agents} />

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 px-6">
        <div className="flex items-center gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-mono transition-colors relative ${
                activeTab === tab.id
                  ? 'text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-400" />
              )}
            </button>
          ))}

          {/* Refresh button */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={loadData}
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors"
              title="Refresh"
            >
              ↻ refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === 'fleet' && <AgentFleet agents={agents} />}
        {activeTab === 'timeline' && (
          <ActivityTimeline activity={activity} systemEvents={systemEvents} />
        )}
        {activeTab === 'map' && (
          <NeuralMap agents={agents} relationships={relationships} />
        )}
      </div>
    </div>
  )
}
