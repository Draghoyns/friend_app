import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, Phone, Search, UserPlus, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { daysSinceSeen, freshnessOf, isEligible, urgency } from '@/lib/scoring'
import FriendCard from './FriendCard'
import TagChip from './TagChip'

type Sort = 'urgency' | 'name' | 'recent'

export default function FriendsTab() {
  const { friends, tiers, tags, showPaused } = useStore()
  const ui = useUi()
  const [query, setQuery]   = useState('')
  const [sort, setSort]     = useState<Sort>('urgency')
  const [tierFilter, setTierFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter]   = useState<string[]>([])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = friends.filter(f => {
      if (!showPaused && f.paused) return false
      if (tierFilter && f.tierId !== tierFilter) return false
      // Several circles selected = friends in all of them, not any.
      if (tagFilter.length && !tagFilter.every(t => f.tagIds.includes(t))) return false
      if (!q) return true
      return f.name.toLowerCase().includes(q) || f.notes?.toLowerCase().includes(q)
    })
    const sorted = [...filtered]
    if (sort === 'name')        sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'recent') sorted.sort((a, b) => daysSinceSeen(a) - daysSinceSeen(b))
    else                        sorted.sort((a, b) => urgency(b, tiers) - urgency(a, tiers))
    return sorted
  }, [friends, tiers, query, sort, tierFilter, tagFilter, showPaused])

  const overdue = friends.filter(f => isEligible(f) && freshnessOf(urgency(f, tiers)) === 'overdue').length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2 space-y-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="friend-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search friends"
              className="input !pl-9"
            />
          </div>
          <button onClick={() => ui.openLog()} className="btn-ghost" title="Log a group meetup">
            <Users size={16} />
          </button>
          <button onClick={() => ui.openImport()} className="btn-ghost" title="Import from contacts">
            <Phone size={16} />
          </button>
          <button onClick={() => ui.openNew()} className="btn-primary" title="New friend">
            <UserPlus size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setTierFilter(null)}
            className={`px-2 py-0.5 rounded text-[11px] shrink-0 border transition-colors ${
              tierFilter === null ? 'text-slate-100 border-slate-500' : 'text-slate-500 border-slate-700'
            }`}
          >
            All {friends.length}
          </button>
          {tiers.map(t => {
            const n = friends.filter(f => f.tierId === t.id).length
            if (!n) return null
            return (
              <button
                key={t.id}
                onClick={() => setTierFilter(tierFilter === t.id ? null : t.id)}
                className="px-2 py-0.5 rounded text-[11px] shrink-0 border transition-colors"
                style={
                  tierFilter === t.id
                    ? { backgroundColor: `${t.color}22`, borderColor: t.color, color: t.color }
                    : { borderColor: '#334155', color: '#94a3b8' }
                }
              >
                {t.name} {n}
              </button>
            )
          })}
          <button
            onClick={() => setSort(sort === 'urgency' ? 'name' : sort === 'name' ? 'recent' : 'urgency')}
            className="ml-auto px-2 py-0.5 rounded text-[11px] shrink-0 border border-slate-700 text-slate-400 flex items-center gap-1"
            title="Change sort order"
          >
            <ArrowDownWideNarrow size={11} />
            {sort === 'urgency' ? 'Most overdue' : sort === 'name' ? 'A → Z' : 'Seen recently'}
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tags.map(t => {
              const n = friends.filter(f => f.tagIds.includes(t.id)).length
              return (
                <TagChip
                  key={t.id}
                  tag={t}
                  count={n}
                  active={tagFilter.includes(t.id)}
                  onClick={() =>
                    setTagFilter(sel => (sel.includes(t.id) ? sel.filter(i => i !== t.id) : [...sel, t.id]))
                  }
                />
              )
            })}
            {tagFilter.length > 0 && (
              <button onClick={() => setTagFilter([])} className="text-[10px] text-slate-500 shrink-0 px-1">
                clear
              </button>
            )}
          </div>
        )}

        {overdue > 0 && (
          <p className="text-[11px] text-rose-400">
            {overdue} {overdue === 1 ? 'person is' : 'people are'} overdue.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {list.map(f => (
          <FriendCard key={f.id} friend={f} tiers={tiers} tags={tags} onOpen={ui.openFriend} onLog={ui.openLog} />
        ))}
        {!list.length && (
          <p className="text-sm text-slate-500 text-center py-10">
            {friends.length ? 'Nobody matches this filter.' : 'No friends yet — add one above.'}
          </p>
        )}
      </div>
    </div>
  )
}
