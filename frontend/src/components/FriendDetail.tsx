import { useMemo, useState } from 'react'
import {
  ArrowLeftRight, CalendarCheck, MapPin, MessageSquare, Pencil, PauseCircle, Phone, PlayCircle, Users, X,
} from 'lucide-react'
import type { Friend, Initiator } from '@/types'
import { useStore } from '@/store/useStore'
import { humanAgo, humanDuration } from '@/lib/dates'
import {
  CALL_KIND, INITIATOR_LABEL, TEXT_KIND, daysUntilDue, intervalOf, kindsOf, lastSeen,
  progressOf, reciprocity, reciprocityHint, tagsOf, tierOf,
} from '@/lib/scoring'
import Avatar from './Avatar'
import SnoozeMenu from './SnoozeMenu'
import TagChip from './TagChip'
import TierBadge from './TierBadge'

interface Props {
  friend:  Friend
  onClose: () => void
  onEdit:  (f: Friend) => void
  onLog:   (f: Friend) => void
}

export default function FriendDetail({ friend, onClose, onEdit, onLog }: Props) {
  const { friends, tiers, tags, kinds, logTouch, updateFriend, updateMeetup, deleteMeetup } = useStore()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const tier     = tierOf(friend, tiers)
  const progress = progressOf(friend, tiers)
  const seen     = lastSeen(friend)
  const left     = daysUntilDue(friend, tiers)
  const recip    = reciprocity(friend)
  const hint     = reciprocityHint(recip, friend.name.split(' ')[0]!)

  // Co-attendees, resolved once per group meetup.
  const others = useMemo(() => {
    const map = new Map<number, Friend[]>()
    for (const m of friend.meetups) {
      if (!m.groupId) continue
      map.set(
        m.id,
        friends.filter(f => f.id !== friend.id && f.meetups.some(o => o.groupId === m.groupId)),
      )
    }
    return map
  }, [friend, friends])

  /** Cycle a log entry through who made it happen, including back to unknown. */
  function cycleInitiator(meetupId: number, current?: Initiator) {
    const order: (Initiator | undefined)[] = ['me', 'them', 'mutual', undefined]
    const next = order[(order.indexOf(current) + 1) % order.length]
    updateMeetup(friend.id, meetupId, { initiator: next })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-5" onClick={e => e.stopPropagation()}>
        {/* ── Identity ───────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={friend.name} size={52} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{friend.name}</h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <TierBadge tier={tier} interval={intervalOf(friend, tiers)} />
              {tagsOf(friend, tags).map(t => <TagChip key={t.id} tag={t} />)}
            </div>
          </div>
          <button onClick={() => onEdit(friend)} className="btn-ghost !p-1.5" title="Edit"><Pencil size={16} /></button>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={18} /></button>
        </div>

        {/* ── At a glance ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Fact label="Last seen" value={seen ? humanAgo(seen) : 'never'} />
          <Fact
            label={left >= 0 ? 'Time left' : 'Overdue by'}
            value={humanDuration(Math.abs(left))}
          />
          <Fact label="Meetups" value={String(friend.meetups.length)} />
        </div>
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: tier?.color ?? 'var(--accent)' }}
          />
        </div>

        {/* ── Reciprocity ────────────────────────────────────────────────── */}
        {recip.known > 0 && (
          <div className="card p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowLeftRight size={13} className="text-slate-500" />
              <span className="text-[11px] uppercase tracking-wider text-slate-500 flex-1">Who reaches out</span>
              <span className="text-[11px] text-slate-400">{recip.known} logged</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
              <div style={{ width: `${(recip.me / recip.known) * 100}%`,     backgroundColor: 'var(--accent)' }} />
              <div style={{ width: `${(recip.mutual / recip.known) * 100}%`, backgroundColor: '#64748b' }} />
              <div style={{ width: `${(recip.them / recip.known) * 100}%`,   backgroundColor: '#475569' }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
              <span>You {recip.me}</span>
              {recip.mutual > 0 && <span>Mutual {recip.mutual}</span>}
              <span>Them {recip.them}</span>
            </div>
            {hint && <p className="text-[11px] text-amber-400 mt-1.5">{hint}</p>}
          </div>
        )}

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => onLog(friend)} className="btn-primary">
            <CalendarCheck size={15} /> I saw them
          </button>
          <button onClick={() => logTouch(friend.id, CALL_KIND)} className="btn-ghost" title="Logs a call, dated today">
            <Phone size={15} /> I called
          </button>
          <button onClick={() => logTouch(friend.id, TEXT_KIND)} className="btn-ghost" title="Logs a text, dated today">
            <MessageSquare size={15} /> I texted
          </button>
          <SnoozeMenu friend={friend} />
          <button onClick={() => updateFriend(friend.id, { paused: !friend.paused })} className="btn-ghost">
            {friend.paused ? <><PlayCircle size={15} /> Resume</> : <><PauseCircle size={15} /> Pause</>}
          </button>
        </div>

        {friend.notes && (
          <div className="mb-4">
            <span className="label">Notes</span>
            <p className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-800 rounded-lg p-3">{friend.notes}</p>
          </div>
        )}

        {/* ── Entry log ──────────────────────────────────────────────────── */}
        <span className="label">Log · {friend.meetups.length} entries</span>
        {!friend.meetups.length ? (
          <p className="text-xs text-slate-500 py-3">
            Nothing logged yet. The clock runs from the day you added {friend.name.split(' ')[0]} ({friend.addedAt}).
          </p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {friend.meetups.map(m => {
              const co = others.get(m.id) ?? []
              return (
                <div key={m.id} className="bg-slate-800 rounded-lg px-3 py-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-medium">{m.date}</span>
                        <span className="text-slate-500">{humanAgo(m.date)}</span>
                        <button
                          onClick={() => cycleInitiator(m.id, m.initiator)}
                          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                            m.initiator
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'border border-dashed border-slate-600 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Who made it happen — tap to change"
                        >
                          {m.initiator ? INITIATOR_LABEL[m.initiator] : 'who reached out?'}
                        </button>
                      </div>
                      {kindsOf(m, kinds).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {kindsOf(m, kinds).map(k => <TagChip key={k.id} tag={k} />)}
                        </div>
                      )}
                      {(m.place || co.length > 0) && (
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                          {m.place && <span className="flex items-center gap-1"><MapPin size={10} /> {m.place}</span>}
                          {co.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users size={10} /> with {co.map(f => f.name.split(' ')[0]).join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                      {m.note && <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{m.note}</p>}
                    </div>
                    {confirmDelete === m.id ? (
                      <button
                        onClick={() => { deleteMeetup(friend.id, m.id); setConfirmDelete(null) }}
                        className="text-[10px] text-rose-400 shrink-0"
                        title={co.length ? 'Removes it for everyone who was there' : 'Delete'}
                      >
                        {co.length ? 'Delete for all' : 'Delete'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(m.id)}
                        className="text-slate-600 hover:text-rose-400 transition-colors shrink-0"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-2.5 text-center">
      <div className="text-sm font-medium truncate text-slate-100">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
