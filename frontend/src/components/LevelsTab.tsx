import { useMemo, useState } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { humanDuration } from '@/lib/dates'
import { INTERVAL_PRESETS, PALETTE, intervalOf } from '@/lib/scoring'
import Avatar from './Avatar'
import type { Tier } from '@/types'

/** Clamp anything the user types into a usable number of days. */
function sanitizeDays(raw: string): number | null {
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.min(n, 3650)
}

export default function LevelsTab() {
  const { friends, tiers, createTier, updateTier, deleteTier, updateFriend } = useStore()
  const ui = useUi()
  // The store keeps tiers sorted by interval, so committing a new frequency
  // reorders the list. Edits live here until blur, otherwise the row would
  // jump out from under the cursor mid-keystroke.
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [newDays, setNewDays] = useState('')

  const customRhythms = useMemo(
    () => friends
      .filter(f => f.customIntervalDays && f.customIntervalDays > 0)
      .sort((a, b) => intervalOf(a, tiers) - intervalOf(b, tiers)),
    [friends, tiers],
  )

  function commitDays(tier: Tier) {
    const raw = draft[tier.id]
    if (raw === undefined) return
    const days = sanitizeDays(raw)
    setDraft(d => { const { [tier.id]: _, ...rest } = d; return rest })
    if (days && days !== tier.intervalDays) updateTier(tier.id, { intervalDays: days })
  }

  function addLevel() {
    const days = sanitizeDays(newDays)
    if (!newName.trim() || !days) return
    createTier({ name: newName.trim(), intervalDays: days, color: PALETTE[tiers.length % PALETTE.length]! })
    setNewName(''); setNewDays('')
  }

  function removeLevel(tier: Tier) {
    const fallback = tiers.find(t => t.id !== tier.id)
    if (fallback) deleteTier(tier.id, fallback.id)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 pt-4 pb-24 space-y-5 max-w-2xl mx-auto">
        <header>
          <h2 className="font-semibold">Levels &amp; rhythm</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Each friendship level carries a target gap between meetups. Change a level here and
            everyone on it is re-ranked straight away.
          </p>
        </header>

        {/* ── The ladder ──────────────────────────────────────────────── */}
        <section className="space-y-2">
          {tiers.map(tier => {
            const count = friends.filter(f => f.tierId === tier.id).length
            const value = draft[tier.id] ?? String(tier.intervalDays)
            return (
              <div key={tier.id} className="card p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                  <input
                    value={tier.name}
                    onChange={e => updateTier(tier.id, { name: e.target.value })}
                    className="input !bg-transparent !border-transparent !px-1 !py-0.5 font-medium"
                  />
                  <span className="text-[11px] text-slate-500 shrink-0 whitespace-nowrap">
                    {count} {count === 1 ? 'friend' : 'friends'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 shrink-0">See them every</span>
                  <input
                    type="number" min={1} max={3650} inputMode="numeric"
                    value={value}
                    onChange={e => setDraft(d => ({ ...d, [tier.id]: e.target.value }))}
                    onBlur={() => commitDays(tier)}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    className="input !py-1 !w-20 text-center"
                  />
                  <span className="text-xs text-slate-400 shrink-0">days</span>
                  <span className="text-[11px] text-slate-600 ml-auto shrink-0">
                    ≈ {humanDuration(tier.intervalDays)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {INTERVAL_PRESETS.map(days => (
                    <button
                      key={days}
                      onClick={() => {
                        setDraft(d => { const { [tier.id]: _, ...rest } = d; return rest })
                        updateTier(tier.id, { intervalDays: days })
                      }}
                      className="px-2 py-0.5 rounded text-[11px] border transition-colors"
                      style={
                        tier.intervalDays === days
                          ? { backgroundColor: `${tier.color}22`, borderColor: tier.color, color: tier.color }
                          : { borderColor: '#334155', color: '#94a3b8' }
                      }
                    >
                      {humanDuration(days)}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      onClick={() => updateTier(tier.id, { color: c })}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        tier.color === c ? 'scale-110 border-slate-300' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Recolor ${tier.name}`}
                    />
                  ))}
                  {!tier.builtin && (
                    <button
                      onClick={() => removeLevel(tier)}
                      className="ml-auto text-[11px] text-rose-400 flex items-center gap-1"
                      title={`Delete ${tier.name}`}
                    >
                      <Trash2 size={11} />
                      Delete{count ? ` (${count} move up)` : ''}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          <div className="flex items-center gap-1.5">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addLevel() }}
              placeholder="New level"
              className="input !py-1.5 !text-xs"
            />
            <input
              type="number" min={1} max={3650} inputMode="numeric"
              value={newDays}
              onChange={e => setNewDays(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addLevel() }}
              placeholder="days"
              className="input !py-1.5 !text-xs !w-20"
            />
            <button onClick={addLevel} className="btn-ghost !p-2" title="Add level"><Plus size={15} /></button>
          </div>
        </section>

        {/* ── Per-friend overrides ────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Custom rhythms</h3>
          {customRhythms.length ? (
            <div className="space-y-1.5">
              {customRhythms.map(friend => {
                const tier  = tiers.find(t => t.id === friend.tierId)
                const key   = `friend-${friend.id}`
                const value = draft[key] ?? String(friend.customIntervalDays)
                return (
                  <div key={friend.id} className="card p-2 flex items-center gap-2">
                    <button onClick={() => ui.openFriend(friend)} className="shrink-0">
                      <Avatar name={friend.name} size={32} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => ui.openFriend(friend)}
                        className="text-sm truncate block max-w-full hover:underline"
                      >
                        {friend.name}
                      </button>
                      <span className="text-[11px] text-slate-500">
                        {tier ? `${tier.name} · ${humanDuration(tier.intervalDays)}` : 'No level'}
                      </span>
                    </div>
                    <input
                      type="number" min={1} max={3650} inputMode="numeric"
                      value={value}
                      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                      onBlur={() => {
                        const raw = draft[key]
                        setDraft(d => { const { [key]: _, ...rest } = d; return rest })
                        const days = raw === undefined ? null : sanitizeDays(raw)
                        if (days && days !== friend.customIntervalDays) {
                          updateFriend(friend.id, { customIntervalDays: days })
                        }
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      className="input !py-1 !w-16 text-center shrink-0"
                    />
                    <span className="text-[11px] text-slate-500 shrink-0">days</span>
                    <button
                      onClick={() => updateFriend(friend.id, { customIntervalDays: null })}
                      className="btn-ghost !p-1.5 shrink-0"
                      title={`Put ${friend.name} back on their level`}
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Nobody overrides their level yet. Open a friend and set a custom rhythm to see
              one person on their own clock — they'll show up here.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
