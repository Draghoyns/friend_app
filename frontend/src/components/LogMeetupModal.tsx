import { useEffect, useMemo, useState } from 'react'
import { Search, Users, X } from 'lucide-react'
import type { Friend, Initiator } from '@/types'
import { useStore } from '@/store/useStore'
import { today } from '@/lib/dates'
import { INITIATOR_LABEL } from '@/lib/scoring'
import Avatar from './Avatar'
import TagPicker from './TagPicker'

const INITIATORS: Initiator[] = ['me', 'them', 'mutual']

/** One meetup, any number of friends, any time of day. Everyone selected gets
 *  their own copy, linked so the timeline shows the occasion once. */
export default function LogMeetupModal({ friend, onClose }: { friend?: Friend; onClose: () => void }) {
  const { friends, logMeetup } = useStore()
  const [attendees, setAttendees] = useState<number[]>(friend ? [friend.id] : [])
  const [date, setDate]           = useState(today())
  const [place, setPlace]         = useState('')
  const [note, setNote]           = useState('')
  const [kindIds, setKindIds]     = useState<string[]>([])
  const [initiator, setInitiator] = useState<Initiator | null>(null)
  const [query, setQuery]         = useState('')
  const [picking, setPicking]     = useState(!friend)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const selected = useMemo(
    () => attendees.map(id => friends.find(f => f.id === id)).filter((f): f is Friend => !!f),
    [attendees, friends],
  )

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return friends
      .filter(f => !attendees.includes(f.id) && (!q || f.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50)
  }, [friends, attendees, query])

  function save() {
    if (!attendees.length) return
    logMeetup(attendees, {
      date,
      kindIds,
      place:     place.trim() || undefined,
      note:      note.trim()  || undefined,
      initiator: initiator ?? undefined,
    })
    onClose()
  }

  const names = selected.map(f => f.name)
  const title = names.length === 0 ? 'Log a meetup'
    : names.length === 1 ? `Saw ${names[0]}`
    : names.length === 2 ? `Saw ${names[0]} and ${names[1]}`
    : `Saw ${names[0]} and ${names.length - 1} others`

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {selected.slice(0, 3).map(f => (
              <Avatar key={f.id} name={f.name} size={36} ring="#0f172a" />
            ))}
            {!selected.length && (
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Users size={17} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{title}</h2>
            <p className="text-xs text-slate-400">
              {attendees.length > 1 ? 'One occasion, logged for everyone present.' : 'Logging a meetup resets their clock.'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={18} /></button>
        </div>

        {/* ── Who was there ──────────────────────────────────────────────── */}
        <label className="label">Who was there</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(f => (
            <button
              key={f.id}
              onClick={() => setAttendees(a => a.filter(id => id !== f.id))}
              className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs"
              title="Remove"
            >
              <Avatar name={f.name} size={18} />
              {f.name}
              <X size={12} className="text-slate-500" />
            </button>
          ))}
          {!picking && (
            <button onClick={() => setPicking(true)} className="btn-ghost !py-0.5 !px-2 !text-xs">
              <Users size={13} /> Add someone
            </button>
          )}
        </div>

        {picking && (
          <div className="mb-3">
            <div className="relative mb-1.5">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                placeholder="Search friends"
                className="input !pl-9 !py-1.5 !text-xs"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {candidates.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setAttendees(a => [...a, f.id]); setQuery('') }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
                >
                  <Avatar name={f.name} size={24} />
                  <span className="text-sm truncate">{f.name}</span>
                </button>
              ))}
              {!candidates.length && (
                <p className="text-xs text-slate-500 py-3 text-center">
                  {friends.length === attendees.length ? 'Everyone is already here.' : 'No match.'}
                </p>
              )}
            </div>
          </div>
        )}

        <label className="label">When</label>
        <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} className="input mb-3" />

        <label className="label">What kind of hangout <span className="text-slate-600">(optional)</span></label>
        <div className="mb-3">
          <TagPicker
            kind="hangout"
            selected={kindIds}
            onToggle={id => setKindIds(ids => (ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]))}
          />
        </div>

        <label className="label">Who made it happen <span className="text-slate-600">(optional)</span></label>
        <div className="flex gap-1.5 mb-3">
          {INITIATORS.map(k => (
            <button
              key={k}
              onClick={() => setInitiator(initiator === k ? null : k)}
              className={`flex-1 px-2 py-1 rounded-lg text-xs border transition-colors ${
                initiator === k ? 'text-slate-100 border-slate-400 bg-slate-800' : 'text-slate-400 border-slate-700'
              }`}
            >
              {INITIATOR_LABEL[k]}
            </button>
          ))}
        </div>

        <label className="label">Where <span className="text-slate-600">(optional)</span></label>
        <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Coffee at Ten Belles" className="input mb-3" />

        <label className="label">Note <span className="text-slate-600">(optional)</span></label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What you talked about, what to follow up on…" className="textarea mb-4" />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={!attendees.length} className="btn-primary disabled:opacity-40">
            Log meetup{attendees.length > 1 ? ` · ${attendees.length} friends` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
