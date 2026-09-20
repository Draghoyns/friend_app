import { useEffect, useState } from 'react'
import { CalendarCheck, MapPin, MoonStar, PauseCircle, PlayCircle, Trash2, X } from 'lucide-react'
import type { Friend, FriendCreate } from '@/types'
import { useStore } from '@/store/useStore'
import { humanAgo, humanDuration, today } from '@/lib/dates'
import { FRESHNESS_META, daysUntilDue, freshnessOf, intervalOf, lastSeen, urgency } from '@/lib/scoring'
import Avatar from './Avatar'

interface Props {
  /** Existing friend to edit, or a prefilled draft for a new one. */
  friend?: Friend
  draft?:  Partial<FriendCreate>
  onClose: () => void
  onLog:   (f: Friend) => void
}

export default function FriendModal({ friend, draft, onClose, onLog }: Props) {
  const { tiers, createFriend, updateFriend, deleteFriend, snooze, unsnooze, deleteMeetup } = useStore()
  const isNew = !friend

  const [name, setName]         = useState(friend?.name ?? draft?.name ?? '')
  const [tierId, setTierId]     = useState(friend?.tierId ?? draft?.tierId ?? tiers[1]?.id ?? tiers[0]!.id)
  const [phone, setPhone]       = useState(friend?.phone ?? draft?.phone ?? '')
  const [email, setEmail]       = useState(friend?.email ?? draft?.email ?? '')
  const [notes, setNotes]       = useState(friend?.notes ?? '')
  const [custom, setCustom]     = useState(friend?.customIntervalDays ? String(friend.customIntervalDays) : '')
  const [lastDate, setLastDate] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const tier = tiers.find(t => t.id === tierId)
  const customDays = custom.trim() ? Math.max(1, parseInt(custom, 10) || 0) : null
  const effective  = customDays ?? tier?.intervalDays ?? 90

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    const payload = {
      name: trimmed,
      tierId,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      customIntervalDays: customDays,
    }
    if (friend) {
      updateFriend(friend.id, payload)
    } else {
      // With no known last meetup the clock starts at `addedAt`, which
      // createFriend sets to today.
      createFriend({
        ...payload,
        photo:  draft?.photo,
        source: draft?.source ?? 'manual',
        meetups: lastDate ? [{ id: Date.now(), date: lastDate }] : [],
      })
    }
    onClose()
  }

  const ratio = friend ? urgency(friend, tiers) : 0
  const fresh = FRESHNESS_META[freshnessOf(ratio)]
  const seen  = friend ? lastSeen(friend) : null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={name || '?'} photo={friend?.photo ?? draft?.photo} size={44} ring={friend ? fresh.dot : undefined} />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">{isNew ? 'New friend' : name}</h2>
            {friend && (
              <p className={`text-xs ${fresh.text}`}>
                {seen ? `Last seen ${humanAgo(seen)}` : 'Never seen'} ·{' '}
                {daysUntilDue(friend, tiers) >= 0
                  ? `${humanDuration(daysUntilDue(friend, tiers))} left`
                  : `${humanDuration(-daysUntilDue(friend, tiers))} overdue`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={18} /></button>
        </div>

        <label className="label">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus={isNew} placeholder="Jeanne" className="input mb-3" />

        <label className="label">Friendship level</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tiers.map(t => (
            <button
              key={t.id}
              onClick={() => setTierId(t.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors"
              style={
                tierId === t.id
                  ? { backgroundColor: `${t.color}22`, borderColor: t.color, color: t.color }
                  : { borderColor: '#334155', color: '#94a3b8' }
              }
            >
              {t.name}
              <span className="opacity-60"> · {humanDuration(t.intervalDays)}</span>
            </button>
          ))}
        </div>

        <label className="label">
          Custom rhythm <span className="text-slate-600">(days — overrides the level)</span>
        </label>
        <input
          type="number" min={1} value={custom} onChange={e => setCustom(e.target.value)}
          placeholder={String(tier?.intervalDays ?? 90)} className="input mb-1"
        />
        <p className="text-[11px] text-slate-500 mb-3">See {name || 'them'} every {humanDuration(effective)}.</p>

        {isNew && (
          <>
            <label className="label">Last time you saw them <span className="text-slate-600">(optional)</span></label>
            <input type="date" value={lastDate} max={today()} onChange={e => setLastDate(e.target.value)} className="input mb-3" />
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="input" />
          </div>
        </div>

        <label className="label">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Kids' names, what they're into, what to ask about…" className="textarea mb-4" />

        {friend && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => onLog(friend)} className="btn-primary">
                <CalendarCheck size={15} /> Log meetup
              </button>
              {friend.snoozedUntil && friend.snoozedUntil > today() ? (
                <button onClick={() => unsnooze(friend.id)} className="btn-ghost">
                  <MoonStar size={15} /> Snoozed until {friend.snoozedUntil}
                </button>
              ) : (
                <button onClick={() => snooze(friend.id, 14)} className="btn-ghost">
                  <MoonStar size={15} /> Snooze 2 weeks
                </button>
              )}
              <button
                onClick={() => updateFriend(friend.id, { paused: !friend.paused })}
                className="btn-ghost"
              >
                {friend.paused ? <><PlayCircle size={15} /> Resume</> : <><PauseCircle size={15} /> Pause</>}
              </button>
            </div>

            {friend.meetups.length > 0 && (
              <div className="mb-4">
                <label className="label">History · {friend.meetups.length} meetups</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {friend.meetups.map(m => (
                    <div key={m.id} className="flex items-start gap-2 text-xs bg-slate-800 rounded-lg px-2.5 py-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.date}</span>
                          <span className="text-slate-500">{humanAgo(m.date)}</span>
                          {m.place && (
                            <span className="text-slate-400 flex items-center gap-0.5 truncate">
                              <MapPin size={10} /> {m.place}
                            </span>
                          )}
                        </div>
                        {m.note && <p className="text-slate-400 mt-0.5 whitespace-pre-wrap">{m.note}</p>}
                      </div>
                      <button
                        onClick={() => deleteMeetup(friend.id, m.id)}
                        className="text-slate-600 hover:text-rose-400 transition-colors shrink-0"
                        title="Delete this meetup"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between gap-2">
          {friend ? (
            confirmDelete ? (
              <button onClick={() => { deleteFriend(friend.id); onClose() }} className="btn-danger">
                <Trash2 size={15} /> Really delete
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="btn-ghost !text-rose-400">
                <Trash2 size={15} />
              </button>
            )
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={!name.trim()} className="btn-primary disabled:opacity-40">
              {isNew ? 'Add friend' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
