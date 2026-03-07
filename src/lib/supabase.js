import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Fetch all agents
export async function fetchAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// Fetch agent activity log
export async function fetchActivity(limit = 50) {
  const { data, error } = await supabase
    .from('agent_activity')
    .select('*, agents(name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Fetch agent relationships
export async function fetchRelationships() {
  const { data, error } = await supabase
    .from('agent_relationships')
    .select('*, source:agents!source_agent_id(name, status), target:agents!target_agent_id(name, status)')
  if (error) throw error
  return data
}

// Fetch system events
export async function fetchSystemEvents(limit = 20) {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Subscribe to real-time changes on agents table
export function subscribeAgents(callback) {
  return supabase
    .channel('agents-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, callback)
    .subscribe()
}

// Subscribe to real-time activity inserts
export function subscribeActivity(callback) {
  return supabase
    .channel('activity-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_activity' }, callback)
    .subscribe()
}

// Subscribe to system events
export function subscribeSystemEvents(callback) {
  return supabase
    .channel('events-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, callback)
    .subscribe()
}
