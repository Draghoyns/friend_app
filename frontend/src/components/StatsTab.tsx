import { useMemo, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { daysBetween, today } from '@/lib/dates'
import { FRESHNESS_META, freshnessOf, isEligible, urgency } from '@/lib/scoring'
import type { Freshness } from '@/types'
import Avatar from './Avatar'

type Period = 30 | 90 | 365

export default function StatsTab() {
  const { friends, tiers } = useStore()
  const ui = useUi()
  const [period, setPeriod] = useState<Period>(90)

  const stats = useMemo(() => {
    const active = friends.filter(isEligible)

    const buckets: Record<Freshness, number> = { fresh: 0, soon: 0, due: 0, overdue: 0 }
    for (const f of active) buckets[freshnessOf(urgency(f, tiers))]++

    const inPeriod = friends.flatMap(f =>
      f.meetups
        .filter(m => daysBetween(m.date, today()) <= period && daysBetween(m.date, today()) >= 0)
        .map(m => ({ friend: f, meetup: m })),
    )

    const perFriend = new Map<number, number>()
    for (const { friend } of inPeriod) perFriend.set(friend.id, (perFriend.get(friend.id) ?? 0) + 1)
    const mostSeen = [...perFriend.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ friend: friends.find(f => f.id === id)!, count }))

    const perTier = tiers.map(t => {
      const members = active.filter(f => f.tierId === t.id)
      const onTrack = members.filter(f => urgency(f, tiers) < 1).length
      return { tier: t, total: members.length, onTrack }
    }).filter(r => r.total > 0)

    // One number for "am I keeping up?": share of eligible friends not yet due.
    const health = active.length
      ? Math.round((active.filter(f => urgency(f, tiers) < 1).length / active.length) * 100)
      : 100

    return { active, buckets, meetups: inPeriod.length, mostSeen, perTier, health }
  }, [friends, tiers, period])

  if (!friends.length) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Add friends to see stats.</div>
  }

  const maxBucket = Math.max(1, ...Object.values(stats.buckets))

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-1.5">
        {([30, 90, 365] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
              period === p ? 'text-slate-950 font-semibold border-transparent' : 'text-slate-400 border-slate-700'
            }`}
            style={period === p ? { backgroundColor: 'var(--accent)' } : {}}
          >
            {p === 30 ? 'Month' : p === 90 ? 'Quarter' : 'Year'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="In orbit" value={stats.active.length} />
        <Stat label="Meetups" value={stats.meetups} />
        <Stat label="On track" value={`${stats.health}%`} />
      </div>

      <section className="card p-4">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">Who needs you</h3>
        <div className="space-y-2">
          {(Object.keys(stats.buckets) as Freshness[]).map(k => {
            const meta = FRESHNESS_META[k]
            return (
              <div key={k} className="flex items-center gap-2">
                <span className={`text-xs w-16 shrink-0 ${meta.text}`}>{meta.label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(stats.buckets[k] / maxBucket) * 100}%`, backgroundColor: meta.dot }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-6 text-right">{stats.buckets[k]}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">By friendship level</h3>
        <div className="space-y-2">
          {stats.perTier.map(({ tier, total, onTrack }) => (
            <div key={tier.id} className="flex items-center gap-2">
              <span className="text-xs w-24 shrink-0 truncate" style={{ color: tier.color }}>{tier.name}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(onTrack / total) * 100}%`, backgroundColor: tier.color }} />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">{onTrack}/{total}</span>
            </div>
          ))}
        </div>
      </section>

      {stats.mostSeen.length > 0 && (
        <section className="card p-4">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">
            Seen most — last {period === 30 ? 'month' : period === 90 ? 'quarter' : 'year'}
          </h3>
          <div className="space-y-2">
            {stats.mostSeen.map(({ friend, count }) => (
              <button
                key={friend.id}
                onClick={() => ui.openFriend(friend)}
                className="w-full flex items-center gap-2.5 text-left hover:bg-slate-800/60 rounded-lg px-1 py-1 transition-colors"
              >
                <Avatar name={friend.name} photo={friend.photo} size={26} />
                <span className="text-sm flex-1 truncate">{friend.name}</span>
                <span className="text-xs text-slate-400">{count}×</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
