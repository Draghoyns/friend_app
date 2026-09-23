import { useMemo, useState } from 'react'
import {
  BatteryLow, CalendarCheck, MessageSquare, MoonStar, PartyPopper, Phone, UserPlus, Users,
} from 'lucide-react'
import type { Friend } from '@/types'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { contactsAvailable } from '@/lib/contacts'
import { humanAgo, humanDuration } from '@/lib/dates'
import {
  CALL_KIND, TEXT_KIND, daysUntilDue, isOverdue, lastSeen, progressOf, ranked, tagsOf, tierOf,
} from '@/lib/scoring'
import Avatar from './Avatar'
import FriendCard from './FriendCard'
import SnoozeMenu from './SnoozeMenu'
import TagChip from './TagChip'
import TierBadge from './TierBadge'

export default function OrbitTab() {
  const { friends, tiers, tags, logTouch, snoozeOverdue } = useStore()
  const ui = useUi()
  const [tiredCount, setTiredCount] = useState<number | null>(null)

  const order = useMemo(() => ranked(friends, tiers), [friends, tiers])
  // `ranked` sorts by urgency, so everyone past their interval sits at the front.
  const due = useMemo(() => order.filter(f => isOverdue(f, tiers)), [order, tiers])
  const overdue = useMemo(
    () => friends.filter(f => !f.paused && isOverdue(f, tiers)).length,
    [friends, tiers],
  )

  /** The queue below the hero card — the same list whether or not anyone is due. */
  function upcoming(list: Friend[], heading = 'Coming up') {
    if (!list.length) return null
    return (
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500">{heading}</h3>
          <button onClick={() => ui.openLog()} className="btn-ghost !py-0.5 !px-2 !text-[11px]">
            <Users size={12} /> Log a meetup with several
          </button>
        </div>
        <div className="space-y-2">
          {list.slice(0, 8).map(f => (
            <FriendCard key={f.id} friend={f} tiers={tiers} tags={tags} onOpen={ui.openFriend} onLog={ui.openLog} />
          ))}
        </div>
      </section>
    )
  }

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
          {contactsAvailable() && (
            <button onClick={() => ui.openImport()} className="btn-primary"><Users size={15} /> From contacts</button>
          )}
          <button onClick={() => ui.openNew()} className={contactsAvailable() ? 'btn-ghost' : 'btn-primary'}>
            <UserPlus size={15} /> By hand
          </button>
        </div>
      </div>
    )
  }

  if (!order.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <MoonStar size={34} className="text-slate-600" />
        <h2 className="font-semibold">Everyone is snoozed or paused</h2>
        <p className="text-sm text-slate-400">Resume someone from the Friends tab to get suggestions again.</p>
      </div>
    )
  }

  // Nothing due: Orbit says so rather than pushing the least-fresh friend at
  // you. The soonest friend by urgency is not always the soonest by the clock,
  // so the countdown takes the minimum.
  if (!due.length) {
    const soonest = order.reduce((min, f) => Math.min(min, daysUntilDue(f, tiers)), Infinity)
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        <section className="card p-6 text-center">
          <PartyPopper size={30} className="mx-auto text-emerald-400" />
          <h2 className="font-semibold mt-3">No hangout due</h2>
          <p className="text-sm text-slate-400 mt-1">
            Everyone is inside their rhythm.
            {soonest === 1 ? ' The next one comes due tomorrow.' : ` The next one comes due in ${humanDuration(soonest)}.`}
          </p>
        </section>

        {upcoming(order)}
      </div>
    )
  }

  // `due` is a prefix of `order`, so the most overdue friend is order[0].
  const [top, ...rest] = order
  const tier     = tierOf(top, tiers)
  const progress = progressOf(top, tiers)
  const seen     = lastSeen(top)
  const left     = daysUntilDue(top, tiers)

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
      <section className="card p-5 text-center">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-4">See this person next</p>

        <button onClick={() => ui.openFriend(top)} className="inline-flex flex-col items-center gap-3">
          <Avatar name={top.name} size={84} />
          <div>
            <h2 className="text-xl font-semibold">{top.name}</h2>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              <TierBadge tier={tier} />
              {tagsOf(top, tags).map(t => <TagChip key={t.id} tag={t} />)}
            </div>
          </div>
        </button>

        <p className="mt-3 text-sm text-slate-400">
          {seen ? `Last seen ${humanAgo(seen)}` : `Never seen — added ${humanAgo(top.addedAt)}`}
          {' · '}
          {left >= 0 ? `${humanDuration(left)} left` : `${humanDuration(-left)} overdue`}
        </p>
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden mt-2 max-w-xs mx-auto">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: tier?.color ?? 'var(--accent)' }}
          />
        </div>

        {top.notes && (
          <p className="mt-3 text-xs text-slate-400 whitespace-pre-wrap max-w-sm mx-auto">{top.notes}</p>
        )}

        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
          <button onClick={() => ui.openLog(top)} className="btn-primary">
            <CalendarCheck size={15} /> I saw them
          </button>
          <button onClick={() => logTouch(top.id, CALL_KIND)} className="btn-ghost" title="Logs a call, dated today">
            <Phone size={15} /> I called
          </button>
          <button onClick={() => logTouch(top.id, TEXT_KIND)} className="btn-ghost" title="Logs a text, dated today">
            <MessageSquare size={15} /> I texted
          </button>
          <SnoozeMenu friend={top} />
        </div>
      </section>

      {overdue > 0 && (
        <section className="card p-3">
          {tiredCount === null ? (
            <button
              onClick={() => setTiredCount(snoozeOverdue(7))}
              className="w-full flex items-center gap-2.5 text-left"
              title="Pushes everyone overdue out by a week"
            >
              <BatteryLow size={18} className="text-slate-400 shrink-0" />
              <span className="min-w-0">
                <span className="text-sm block">I'm socially tired</span>
                <span className="text-[11px] text-slate-500">
                  Snooze all {overdue} overdue {overdue === 1 ? 'friend' : 'friends'} for a week
                </span>
              </span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <BatteryLow size={16} className="shrink-0" />
              {tiredCount === 0
                ? 'Nobody needed snoozing.'
                : `${tiredCount} ${tiredCount === 1 ? 'friend' : 'friends'} snoozed for a week. Rest up.`}
            </p>
          )}
        </section>
      )}

      {upcoming(rest, 'Then')}
    </div>
  )
}
