import { useState, useEffect } from 'react'
import { fetchWorkspaceFiles } from '../lib/supabase'

const FILE_ICONS = {
  markdown: '📄',
  json: '{}',
  text: '📝',
}

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

function renderContent(file) {
  if (file.file_type === 'json') {
    try {
      const parsed = JSON.parse(file.content)
      return (
        <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )
    } catch {
      return <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap">{file.content}</pre>
    }
  }

  if (file.file_type === 'markdown') {
    // Simple markdown rendering — headers, bold, code blocks, lists
    const lines = file.content.split('\n')
    return (
      <div className="text-[12px] text-zinc-300 leading-relaxed space-y-1">
        {lines.map((line, i) => {
          if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-zinc-200 mt-3 mb-1">{line.slice(4)}</h3>
          if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold text-zinc-100 mt-4 mb-1">{line.slice(3)}</h2>
          if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-zinc-100 mt-4 mb-2">{line.slice(2)}</h1>
          if (line.startsWith('```')) return <hr key={i} className="border-zinc-800 my-2" />
          if (line.startsWith('- ')) return <div key={i} className="pl-3 text-zinc-400">• {line.slice(2)}</div>
          if (line.trim() === '') return <div key={i} className="h-2" />
          return <p key={i} className="text-zinc-400">{line}</p>
        })}
      </div>
    )
  }

  return <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap">{file.content}</pre>
}

export default function WorkspaceSync() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    fetchWorkspaceFiles()
      .then(data => {
        setFiles(data || [])
        if (data && data.length > 0) setSelectedFile(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-zinc-500 text-sm font-mono py-8 text-center">Loading workspace files...</div>

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-4">Workspace Sync</h2>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Files Synced</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">{files.length}</div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Total Size</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">
            {formatBytes(files.reduce((sum, f) => sum + (f.file_size_bytes || 0), 0))}
          </div>
        </div>
        <div className="rounded-lg border px-4 py-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Last Sync</div>
          <div className="text-xl font-bold text-zinc-200 font-mono">
            {files.length > 0 ? timeAgo(files.reduce((latest, f) => {
              const t = new Date(f.updated_at).getTime()
              return t > latest ? t : latest
            }, 0)) : '—'}
          </div>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-320px)]">
        {/* File list */}
        <div className="w-64 rounded-lg border overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Files</span>
          </div>
          <div className="overflow-y-auto">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                  selectedFile?.id === file.id ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'
                }`}
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{FILE_ICONS[file.file_type] || '📄'}</span>
                  <span className={`text-sm font-medium truncate ${selectedFile?.id === file.id ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {file.file_path}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
                  <span>{formatBytes(file.file_size_bytes)}</span>
                  <span>{timeAgo(file.updated_at)}</span>
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center text-zinc-600 py-8 text-sm">No files synced</div>
            )}
          </div>
        </div>

        {/* Content viewer */}
        <div className="flex-1 rounded-lg border overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {selectedFile ? (
            <>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-sm font-medium text-zinc-200">{selectedFile.file_path}</span>
                  <span className="text-[10px] font-mono text-zinc-600 ml-2">{selectedFile.file_type}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
                  <span>{formatBytes(selectedFile.file_size_bytes)}</span>
                  <span className="text-zinc-700">sha256:{selectedFile.content_hash?.slice(0, 8)}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {renderContent(selectedFile)}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm font-mono">
              Select a file to view
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
