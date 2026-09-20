import { CalendarCheck, Clock, MoonStar, PauseCircle } from 'lucide-react'
import type { Friend, Tag, Tier } from '@/types'
import { humanAgo, humanDuration } from '@/lib/dates'
import {
  FRESHNESS_META, daysSinceSeen, daysUntilDue, freshnessOf, intervalOf, lastSeen, tagsOf, tierOf, urgency,
} from '@/lib/scoring'
import Avatar from './Avatar'
import TagChip from './TagChip'
import TierBadge from './TierBadge'

interface Props {
  friend:  Friend
  tiers:   Tier[]
  tags:    Tag[]
  onOpen:  (f: Friend) => void
  onLog:   (f: Friend) => void
}

export default function FriendCard({ friend, tiers, tags, onOpen, onLog }: Props) {
  const ratio    = urgency(friend, tiers)
  const fresh    = FRESHNESS_META[freshnessOf(ratio)]
  const interval = intervalOf(friend, tiers)
  const left     = daysUntilDue(friend, tiers)
  const seen     = lastSeen(friend)

  return (
    <div className="card p-3 flex items-center gap-3 hover:bg-slate-800/60 transition-colors">
      <button onClick={() => onOpen(friend)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <Avatar name={friend.name} photo={friend.photo} ring={fresh.dot} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{friend.name}</span>
            {friend.paused && <PauseCircle size={13} className="text-slate-500 shrink-0" />}
            {!friend.paused && friend.snoozedUntil && (
              <MoonStar size={13} className="text-slate-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <TierBadge tier={tierOf(friend, tiers)} />
            {tagsOf(friend, tags).slice(0, 2).map(t => <TagChip key={t.id} tag={t} />)}
            <span className={`text-[11px] ${fresh.text}`}>
              {seen ? `seen ${humanAgo(seen)}` : `never seen · added ${humanAgo(friend.addedAt)}`}
            </span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (daysSinceSeen(friend) / interval) * 100)}%`,
                backgroundColor: fresh.dot,
              }}
            />
          </div>
        </div>
      </button>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[11px] font-medium ${fresh.text} flex items-center gap-1`}>
          <Clock size={11} />
          {left >= 0 ? `${humanDuration(left)} left` : `${humanDuration(-left)} over`}
        </span>
        <button onClick={() => onLog(friend)} className="btn-ghost !px-2 !py-1" title="Log a meetup">
          <CalendarCheck size={16} />
        </button>
      </div>
    </div>
  )
}
