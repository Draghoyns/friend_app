import { useMemo } from 'react'
import { History, MapPin, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { humanAgo, parseLocalDate } from '@/lib/dates'
import { INITIATOR_LABEL, meetupEntries } from '@/lib/scoring'
import Avatar from './Avatar'

/** "September 2026" heading for a YYYY-MM-DD date. */
const monthLabel = (date: string) =>
  parseLocalDate(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export default function TimelineTab() {
  const { friends } = useStore()
  const ui = useUi()

  const entries = useMemo(() => meetupEntries(friends), [friends])

  if (!entries.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <History size={32} className="text-slate-600" />
        <p className="text-sm text-slate-400">No meetups logged yet. Every one you log shows up here.</p>
        <button onClick={() => ui.openLog()} className="btn-primary mt-1">Log one now</button>
      </div>
    )
  }

  let lastMonth = ''

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {entries.map(({ meetup, friends: present }) => {
        const month = monthLabel(meetup.date)
        const heading = month !== lastMonth ? month : null
        lastMonth = month
        const group = present.length > 1

        return (
          <div key={meetup.groupId ?? `${present[0]!.id}-${meetup.id}`}>
            {heading && (
              <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mt-4 mb-2 first:mt-0">
                {heading}
              </h3>
            )}
            <div className="card p-3 mb-2">
              <div className="flex items-start gap-3">
                <div className="flex -space-x-2 shrink-0">
                  {present.slice(0, 3).map(f => (
                    <button key={f.id} onClick={() => ui.openFriend(f)} title={f.name}>
                      <Avatar name={f.name} photo={f.photo} size={34} ring="#0f172a" />
                    </button>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {present.map(f => f.name).join(', ')}
                    </span>
                    <span className="text-[11px] text-slate-500 shrink-0">{humanAgo(meetup.date)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>{meetup.date}</span>
                    {meetup.place && (
                      <span className="flex items-center gap-0.5 truncate"><MapPin size={10} /> {meetup.place}</span>
                    )}
                    {group && (
                      <span className="flex items-center gap-0.5"><Users size={10} /> {present.length} people</span>
                    )}
                    {meetup.initiator && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {INITIATOR_LABEL[meetup.initiator]}
                      </span>
                    )}
                  </div>
                  {meetup.note && (
                    <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{meetup.note}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
