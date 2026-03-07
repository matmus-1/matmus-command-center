const NAV_ITEMS = [
  { id: 'agents', label: 'Agents', icon: '⬡' },
  { id: 'timeline', label: 'Timeline', icon: '◷' },
  { id: 'cron', label: 'Cron Health', icon: '⟳' },
  { id: 'events', label: 'Events', icon: '⚡' },
]

export default function Sidebar({ activeView, onViewChange }) {
  return (
    <div className="w-48 h-screen flex flex-col border-r" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      {/* Brand */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-sm tracking-wider">MATMUS</span>
        </div>
        <div className="text-zinc-600 text-[10px] font-mono mt-0.5">command center</div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
              activeView === item.id
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-base opacity-70">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-[10px] font-mono text-zinc-600" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>system online</span>
        </div>
        <span className="text-zinc-700">v1.0.0</span>
      </div>
    </div>
  )
}
