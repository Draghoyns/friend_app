import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Loader2, Search, UserPlus, X } from 'lucide-react'
import type { FriendCreate, ImportedContact } from '@/types'
import { contactsAreOsPicked, loadContacts } from '@/lib/contacts'
import { useStore } from '@/store/useStore'
import Avatar from './Avatar'

interface Props {
  onClose:  () => void
  /** Opens the friend editor prefilled with the picked contact. */
  onPicked: (draft: Partial<FriendCreate>) => void
}

export default function ContactImportModal({ onClose, onPicked }: Props) {
  const { friends, tiers } = useStore()
  const [state, setState]   = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError]   = useState('')
  const [contacts, setContacts] = useState<ImportedContact[]>([])
  const [query, setQuery]   = useState('')

  useEffect(() => {
    let cancelled = false
    loadContacts().then(res => {
      if (cancelled) return
      if (res.ok) { setContacts(res.contacts); setState('ready') }
      else        { setError(res.message);    setState('error') }
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Names already in Orbit — shown as "added" instead of being hidden, so you
  // can tell the difference between "not in the address book" and "already here".
  const existing = useMemo(
    () => new Set(friends.map(f => f.name.toLowerCase())),
    [friends],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? contacts.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          c.email?.toLowerCase().includes(q))
      : contacts
    return list.slice(0, 200)
  }, [contacts, query])

  function pick(c: ImportedContact) {
    onPicked({
      name:   c.name,
      phone:  c.phone,
      email:  c.email,
      photo:  c.photo,
      tierId: tiers[1]?.id ?? tiers[0]!.id,
      source: 'contacts',
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold flex-1">Import from contacts</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={18} /></button>
        </div>

        {state === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
            <Loader2 size={16} className="animate-spin" />
            {contactsAreOsPicked() ? 'Waiting for the browser contact picker…' : 'Reading your address book…'}
          </div>
        )}

        {state === 'error' && (
          <div className="py-6 text-center">
            <AlertCircle size={22} className="mx-auto mb-2 text-amber-400" />
            <p className="text-sm text-slate-300 mb-4">{error}</p>
            <button onClick={() => onPicked({ source: 'manual' })} className="btn-primary">
              <UserPlus size={15} /> Add by hand instead
            </button>
          </div>
        )}

        {state === 'ready' && (
          <>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                placeholder={`Search ${contacts.length} contacts`}
                className="input !pl-9"
              />
            </div>

            <div className="space-y-1 max-h-[55vh] overflow-y-auto">
              {results.map(c => {
                const already = existing.has(c.name.toLowerCase())
                return (
                  <button
                    key={c.key}
                    onClick={() => pick(c)}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                  >
                    <Avatar name={c.name} photo={c.photo} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">{c.name}</div>
                      {(c.phone || c.email) && (
                        <div className="text-[11px] text-slate-500 truncate">{c.phone ?? c.email}</div>
                      )}
                    </div>
                    {already && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 shrink-0">
                        <Check size={11} /> in Orbit
                      </span>
                    )}
                  </button>
                )
              })}
              {!results.length && (
                <p className="text-sm text-slate-500 text-center py-6">No contact matches “{query}”.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
