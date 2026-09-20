import { useState } from 'react'
import { MoonStar, X } from 'lucide-react'
import type { Friend } from '@/types'
import { useStore } from '@/store/useStore'
import { today } from '@/lib/dates'

const PRESETS: { label: string; days: number }[] = [
  { label: '3 days',   days: 3   },
  { label: 'A week',   days: 7   },
  { label: '2 weeks',  days: 14  },
  { label: 'A month',  days: 30  },
  { label: '3 months', days: 90  },
]

/** Snooze button that opens a duration picker. A snoozed friend keeps ageing —
 *  the snooze only hides them from suggestions until the date you pick. */
export default function SnoozeMenu({ friend, className = 'btn-ghost' }: { friend: Friend; className?: string }) {
  const { snooze, snoozeUntil, unsnooze } = useStore()
  const [open, setOpen] = useState(false)
  const active = !!friend.snoozedUntil && friend.snoozedUntil > today()

  if (active && !open) {
    return (
      <button onClick={() => unsnooze(friend.id)} className={className} title="Cancel the snooze">
        <MoonStar size={15} /> Until {friend.snoozedUntil} <X size={13} className="opacity-60" />
      </button>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={className}>
        <MoonStar size={15} /> Not now
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 rounded-lg p-1.5">
      <span className="text-[11px] text-slate-400 px-1">Remind me in</span>
      {PRESETS.map(p => (
        <button
          key={p.days}
          onClick={() => { snooze(friend.id, p.days); setOpen(false) }}
          className="px-1.5 py-0.5 rounded text-[11px] border border-slate-600 text-slate-300 hover:border-slate-400 transition-colors"
        >
          {p.label}
        </button>
      ))}
      <input
        type="date"
        min={today()}
        onChange={e => { if (e.target.value) { snoozeUntil(friend.id, e.target.value); setOpen(false) } }}
        className="input !py-0.5 !text-[11px] !w-32"
        title="Snooze until a specific date"
      />
      <button onClick={() => setOpen(false)} className="btn-ghost !p-1"><X size={13} /></button>
    </div>
  )
}
