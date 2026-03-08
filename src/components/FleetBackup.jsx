import { useState, useEffect } from 'react'
import { fetchBackups, createBackup, fetchAgents, fetchCronJobs, fetchWorkspaceFiles, fetchRelationships } from '../lib/supabase'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(date) {
  if (!date) return 'never'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function FleetBackup() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchBackups()
      .then(data => setBackups(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      // Gather all fleet data
      const [agents, cronJobs, workspaceFiles, relationships] = await Promise.all([
        fetchAgents(),
        fetchCronJobs(),
        fetchWorkspaceFiles(),
        fetchRelationships(),
      ])

      const backupData = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        agents: agents || [],
        cron_jobs: cronJobs || [],
        workspace_files: (workspaceFiles || []).map(f => ({
          file_path: f.file_path,
          file_type: f.file_type,
          content_hash: f.content_hash,
          file_size_bytes: f.file_size_bytes,
          content: f.content,
        })),
        relationships: relationships || [],
      }

      const jsonStr = JSON.stringify(backupData, null, 2)
      const sizeBytes = new Blob([jsonStr]).size

      // Save to Supabase
      const saved = await createBackup({
        backup_data: backupData,
        agents_count: (agents || []).length,
        backup_size_bytes: sizeBytes,
        description: `Manual backup — ${(agents || []).length} agents, ${(cronJobs || []).length} cron jobs, ${(workspaceFiles || []).length} files`,
      })

      // Trigger browser download
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matmus-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Refresh backup list
      const updated = await fetchBackups()
      setBackups(updated || [])
    } catch (err) {
      console.error('Backup failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadExisting = (backup) => {
    const jsonStr = JSON.stringify(backup.backup_data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `matmus-backup-${backup.created_at?.split('T')[0] || 'unknown'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-zinc-500 text-sm font-mono py-8 text-center">Loading backups...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-200">Fleet Backup</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-[10px] font-mono px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
        >
          {exporting ? 'Exporting...' : '↓ Export Backup'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Total Backups</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">{backups.length}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Latest</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">
            {backups.length > 0 ? timeAgo(backups[0].created_at) : '—'}
          </div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Total Size</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">
            {formatBytes(backups.reduce((sum, b) => sum + (b.backup_size_bytes || 0), 0))}
          </div>
        </div>
      </div>

      {/* Backup list */}
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Backup History</span>
        </div>

        {backups.length === 0 ? (
          <div className="text-center text-zinc-600 py-8 text-sm font-mono">
            No backups yet — click Export to create one
          </div>
        ) : (
          backups.map(backup => (
            <div
              key={backup.id}
              className="border-b cursor-pointer hover:bg-white/[0.02] transition-colors"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setExpandedId(expandedId === backup.id ? null : backup.id)}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-base">📦</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 font-medium">
                    {backup.created_at ? new Date(backup.created_at).toLocaleDateString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : 'Unknown date'}
                  </div>
                  {backup.description && (
                    <div className="text-[10px] font-mono text-zinc-600 mt-0.5 truncate">{backup.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600 flex-shrink-0">
                  <span>{backup.agents_count} agents</span>
                  <span>{formatBytes(backup.backup_size_bytes)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadExisting(backup) }}
                  className="text-[10px] font-mono px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors flex-shrink-0"
                >
                  ↓
                </button>
              </div>

              {expandedId === backup.id && backup.backup_data && (
                <div className="px-4 pb-3 pt-1 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                  <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
                    <div className="bg-zinc-900/50 rounded p-2 text-center">
                      <div className="text-zinc-600 uppercase mb-1">Agents</div>
                      <div className="text-zinc-300 text-sm font-bold">{backup.backup_data.agents?.length || 0}</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded p-2 text-center">
                      <div className="text-zinc-600 uppercase mb-1">Cron Jobs</div>
                      <div className="text-zinc-300 text-sm font-bold">{backup.backup_data.cron_jobs?.length || 0}</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded p-2 text-center">
                      <div className="text-zinc-600 uppercase mb-1">Files</div>
                      <div className="text-zinc-300 text-sm font-bold">{backup.backup_data.workspace_files?.length || 0}</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded p-2 text-center">
                      <div className="text-zinc-600 uppercase mb-1">Relations</div>
                      <div className="text-zinc-300 text-sm font-bold">{backup.backup_data.relationships?.length || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
