import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Friend } from '@/types'
import { useStore } from '@/store/useStore'
import { today } from '@/lib/dates'
import Avatar from './Avatar'

export default function LogMeetupModal({ friend, onClose }: { friend: Friend; onClose: () => void }) {
  const logMeetup = useStore(s => s.logMeetup)
  const [date, setDate]   = useState(today())
  const [place, setPlace] = useState('')
  const [note, setNote]   = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function save() {
    logMeetup(friend.id, { date, place: place.trim() || undefined, note: note.trim() || undefined })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={friend.name} photo={friend.photo} size={36} />
          <div className="flex-1">
            <h2 className="font-semibold">Saw {friend.name}</h2>
            <p className="text-xs text-slate-400">Logging a meetup resets their clock.</p>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={18} /></button>
        </div>

        <label className="label">When</label>
        <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} className="input mb-3" />

        <label className="label">Where <span className="text-slate-600">(optional)</span></label>
        <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Coffee at Ten Belles" className="input mb-3" />

        <label className="label">Note <span className="text-slate-600">(optional)</span></label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What you talked about, what to follow up on…" className="textarea mb-4" />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} className="btn-primary">Log meetup</button>
        </div>
      </div>
    </div>
  )
}
