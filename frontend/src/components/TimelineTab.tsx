import { useMemo } from 'react'
import { MapPin, History } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { humanAgo, parseLocalDate } from '@/lib/dates'
import Avatar from './Avatar'

/** "September 2026" heading for a YYYY-MM-DD date. */
const monthLabel = (date: string) =>
  parseLocalDate(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export default function TimelineTab() {
  const { friends } = useStore()
  const ui = useUi()

  const entries = useMemo(() => {
    const all = friends.flatMap(f => f.meetups.map(m => ({ meetup: m, friend: f })))
    all.sort((a, b) => (a.meetup.date < b.meetup.date ? 1 : -1))
    return all
  }, [friends])

  if (!entries.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <History size={32} className="text-slate-600" />
        <p className="text-sm text-slate-400">No meetups logged yet. Every one you log shows up here.</p>
      </div>
    )
  }

  let lastMonth = ''

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {entries.map(({ meetup, friend }) => {
        const month = monthLabel(meetup.date)
        const heading = month !== lastMonth ? month : null
        lastMonth = month
        return (
          <div key={`${friend.id}-${meetup.id}`}>
            {heading && (
              <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mt-4 mb-2 first:mt-0">
                {heading}
              </h3>
            )}
            <button
              onClick={() => ui.openFriend(friend)}
              className="w-full card p-3 flex items-start gap-3 mb-2 text-left hover:bg-slate-800/60 transition-colors"
            >
              <Avatar name={friend.name} photo={friend.photo} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium truncate">{friend.name}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">{humanAgo(meetup.date)}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{meetup.date}</span>
                  {meetup.place && (
                    <span className="flex items-center gap-0.5 truncate"><MapPin size={10} /> {meetup.place}</span>
                  )}
                </div>
                {meetup.note && (
                  <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{meetup.note}</p>
                )}
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
