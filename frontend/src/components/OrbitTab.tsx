import { useMemo } from 'react'
import { CalendarCheck, MoonStar, PartyPopper, Phone, UserPlus, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { humanAgo, humanDuration } from '@/lib/dates'
import {
  FRESHNESS_META, daysUntilDue, freshnessOf, lastSeen, ranked, tagsOf, tierOf, urgency,
} from '@/lib/scoring'
import Avatar from './Avatar'
import FriendCard from './FriendCard'
import SnoozeMenu from './SnoozeMenu'
import TagChip from './TagChip'
import TierBadge from './TierBadge'

export default function OrbitTab() {
  const { friends, tiers, tags } = useStore()
  const ui = useUi()

  const order = useMemo(() => ranked(friends, tiers), [friends, tiers])
  const [top, ...rest] = order

  if (!friends.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <Users size={34} className="text-slate-600" />
        <h2 className="font-semibold">No one in orbit yet</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          Add the people you want to keep seeing, pick how close they are, and Orbit tells you who is
          slipping away.
        </p>
        <div className="flex gap-2 mt-1">
          <button onClick={() => ui.openImport()} className="btn-primary"><Phone size={15} /> From contacts</button>
          <button onClick={() => ui.openNew()} className="btn-ghost"><UserPlus size={15} /> By hand</button>
        </div>
      </div>
    )
  }

  if (!top) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <MoonStar size={34} className="text-slate-600" />
        <h2 className="font-semibold">Everyone is snoozed or paused</h2>
        <p className="text-sm text-slate-400">Resume someone from the Friends tab to get suggestions again.</p>
      </div>
    )
  }

  const ratio = urgency(top, tiers)
  const fresh = FRESHNESS_META[freshnessOf(ratio)]
  const seen  = lastSeen(top)
  const left  = daysUntilDue(top, tiers)
  const onSchedule = ratio < 0.9

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <section className="card p-5 text-center">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-4">
          {onSchedule ? 'Everyone is up to date — next up' : 'See this person next'}
        </p>

        <button onClick={() => ui.openFriend(top)} className="inline-flex flex-col items-center gap-3">
          <Avatar name={top.name} photo={top.photo} size={84} ring={fresh.dot} />
          <div>
            <h2 className="text-xl font-semibold">{top.name}</h2>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              <TierBadge tier={tierOf(top, tiers)} />
              {tagsOf(top, tags).map(t => <TagChip key={t.id} tag={t} />)}
            </div>
          </div>
        </button>

        <p className={`mt-3 text-sm ${fresh.text}`}>
          {seen ? `Last seen ${humanAgo(seen)}` : `Never seen — added ${humanAgo(top.addedAt)}`}
          {' · '}
          {left >= 0 ? `${humanDuration(left)} left` : `${humanDuration(-left)} overdue`}
        </p>

        {top.notes && (
          <p className="mt-3 text-xs text-slate-400 whitespace-pre-wrap max-w-sm mx-auto">{top.notes}</p>
        )}

        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
          <button onClick={() => ui.openLog(top)} className="btn-primary">
            <CalendarCheck size={15} /> I saw them
          </button>
          {top.phone && (
            <a href={`tel:${top.phone}`} className="btn-ghost"><Phone size={15} /> Call</a>
          )}
          <SnoozeMenu friend={top} />
        </div>

        {onSchedule && (
          <p className="mt-4 text-[11px] text-emerald-400 flex items-center justify-center gap-1">
            <PartyPopper size={12} /> Nobody is overdue. Nice.
          </p>
        )}
      </section>

      {rest.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500">Then</h3>
            <button onClick={() => ui.openLog()} className="btn-ghost !py-0.5 !px-2 !text-[11px]">
              <Users size={12} /> Log a group meetup
            </button>
          </div>
          <div className="space-y-2">
            {rest.slice(0, 8).map(f => (
              <FriendCard key={f.id} friend={f} tiers={tiers} tags={tags} onOpen={ui.openFriend} onLog={ui.openLog} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
