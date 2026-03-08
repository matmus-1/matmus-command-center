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

// ===== TASKS =====
export async function fetchTasks(filters = {}) {
  let query = supabase.from('tasks').select('*')
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.agent_id) query = query.eq('agent_id', filters.agent_id)
  const { data, error } = await query
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function createTask(task) {
  const { data, error } = await supabase.from('tasks').insert([task]).select()
  if (error) throw error
  return data[0]
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select()
  if (error) throw error
  return data[0]
}

export function subscribeTasks(callback) {
  return supabase
    .channel('tasks-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe()
}

// ===== TOKEN USAGE =====
export async function fetchTokenUsage(days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await supabase
    .from('token_usage')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function subscribeTokenUsage(callback) {
  return supabase
    .channel('token-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'token_usage' }, callback)
    .subscribe()
}

// ===== CRON JOBS =====
export async function fetchCronJobs() {
  const { data, error } = await supabase
    .from('cron_jobs')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export function subscribeCronJobs(callback) {
  return supabase
    .channel('cron-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cron_jobs' }, callback)
    .subscribe()
}

// ===== WORKSPACE FILES =====
export async function fetchWorkspaceFiles() {
  const { data, error } = await supabase
    .from('workspace_files')
    .select('*')
    .order('file_path', { ascending: true })
  if (error) throw error
  return data
}

// ===== FLEET BACKUPS =====
export async function fetchBackups() {
  const { data, error } = await supabase
    .from('fleet_backups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

export async function createBackup(backupData) {
  const { data, error } = await supabase.from('fleet_backups').insert([backupData]).select()
  if (error) throw error
  return data[0]
}
