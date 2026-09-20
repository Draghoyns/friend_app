import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Friend, FriendCreate } from '@/types'
import { useStore } from '@/store/useStore'
import { humanDuration, today } from '@/lib/dates'
import Avatar from './Avatar'
import TagPicker from './TagPicker'

interface Props {
  /** Existing friend to edit, or a prefilled draft for a new one. */
  friend?: Friend
  draft?:  Partial<FriendCreate>
  onClose: () => void
}

/** The edit form. Reading a friend happens in FriendDetail. */
export default function FriendModal({ friend, draft, onClose }: Props) {
  const { tiers, createFriend, updateFriend, deleteFriend } = useStore()
  const isNew = !friend

  const [name, setName]         = useState(friend?.name ?? draft?.name ?? '')
  const [tierId, setTierId]     = useState(friend?.tierId ?? draft?.tierId ?? tiers[1]?.id ?? tiers[0]!.id)
  const [tagIds, setTagIds]     = useState<string[]>(friend?.tagIds ?? draft?.tagIds ?? [])
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

  function toggleTag(tagId: string) {
    setTagIds(ids => (ids.includes(tagId) ? ids.filter(i => i !== tagId) : [...ids, tagId]))
  }

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    const payload = {
      name: trimmed,
      tierId,
      tagIds,
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={name || '?'} photo={friend?.photo ?? draft?.photo} size={44} />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">{isNew ? 'New friend' : `Edit ${friend.name}`}</h2>
            <p className="text-xs text-slate-400">
              {isNew ? 'How close are you, and how often do you want to see them?' : 'Name, level, circles and notes.'}
            </p>
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

        <label className="label">Circles</label>
        <div className="mb-3"><TagPicker selected={tagIds} onToggle={toggleTag} /></div>

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
