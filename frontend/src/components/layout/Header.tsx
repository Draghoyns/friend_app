import { CalendarClock, Gauge, History, Orbit, PieChart, UserPlus, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import type { Tab } from '@/types'

const tabs: { id: Tab; label: string; icon: typeof Orbit }[] = [
  { id: 'orbit',    label: 'Who next', icon: CalendarClock },
  { id: 'friends',  label: 'Friends',  icon: Users         },
  { id: 'levels',   label: 'Levels',   icon: Gauge         },
  { id: 'timeline', label: 'Timeline', icon: History       },
  { id: 'stats',    label: 'Stats',    icon: PieChart      },
]

export default function Header() {
  const { activeTab, setActiveTab, setSidebarOpen } = useStore()
  const ui = useUi()

  return (
    <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <button
        onClick={() => setSidebarOpen(true)}
        className="flex items-center gap-2 mr-2 rounded-lg hover:opacity-80 transition-opacity"
        title="Open menu"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-950"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Orbit size={17} />
        </div>
        <span className="font-semibold tracking-tight hidden sm:block">Orbit</span>
      </button>

      <nav className="flex items-center gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === id ? 'text-slate-950' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
            style={activeTab === id ? { backgroundColor: 'var(--accent)' } : {}}
          >
            <Icon size={18} />
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-600 font-mono select-none">
          <span title="New friend"><kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900">N</kbd> friend</span>
          <span title="Search"><kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900">/</kbd> search</span>
        </div>
        <button onClick={() => ui.openNew()} className="btn-ghost !p-2" title="New friend">
          <UserPlus size={18} />
        </button>
      </div>
    </header>
  )
}
