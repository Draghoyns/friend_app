import { useMemo, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useUi } from '@/lib/ui'
import { daysBetween, today } from '@/lib/dates'
import { isEligible, meetupEntries, progressOf, reciprocity, tierOf, urgency } from '@/lib/scoring'
import Avatar from './Avatar'

type Period = 30 | 90 | 365

export default function StatsTab() {
  const { friends, tiers, tags, kinds } = useStore()
  const ui = useUi()
  const [period, setPeriod] = useState<Period>(90)

  const stats = useMemo(() => {
    const active = friends.filter(isEligible)

    // Named freshness buckets are gone — a plain "furthest behind" list says
    // the same thing without filing people under a label.
    const behind = active
      .filter(f => urgency(f, tiers) >= 1)
      .sort((a, b) => urgency(b, tiers) - urgency(a, tiers))
      .slice(0, 5)

    const inPeriod = friends.flatMap(f =>
      f.meetups
        .filter(m => daysBetween(m.date, today()) <= period && daysBetween(m.date, today()) >= 0)
        .map(m => ({ friend: f, meetup: m })),
    )

    // Evenings, not per-friend copies: a dinner with four people counts once.
    const occasions = meetupEntries(friends).filter(e => {
      const d = daysBetween(e.meetup.date, today())
      return d >= 0 && d <= period
    })
    const groupOccasions = occasions.filter(e => e.friends.length > 1).length

    const perFriend = new Map<number, number>()
    for (const { friend } of inPeriod) perFriend.set(friend.id, (perFriend.get(friend.id) ?? 0) + 1)
    const mostSeen = [...perFriend.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ friend: friends.find(f => f.id === id)!, count }))

    // Reciprocity across everyone, so one number answers "am I always the one
    // reaching out?"
    const totals = friends.reduce(
      (acc, f) => {
        const r = reciprocity(f)
        return { me: acc.me + r.me, them: acc.them + r.them, mutual: acc.mutual + r.mutual, known: acc.known + r.known }
      },
      { me: 0, them: 0, mutual: 0, known: 0 },
    )
    const alwaysMe = friends
      .map(f => ({ friend: f, r: reciprocity(f) }))
      .filter(x => x.r.known >= 3 && x.r.share !== null && x.r.share >= 0.75)
      .sort((a, b) => b.r.share! - a.r.share! || b.r.known - a.r.known)
      .slice(0, 5)

    const perKind = kinds.map(k => ({
      kind:  k,
      count: occasions.filter(e => e.meetup.kindIds?.includes(k.id)).length,
    })).filter(r => r.count > 0).sort((a, b) => b.count - a.count)

    const perTag = tags.map(t => {
      const members = active.filter(f => f.tagIds.includes(t.id))
      return { tag: t, total: members.length, onTrack: members.filter(f => urgency(f, tiers) < 1).length }
    }).filter(r => r.total > 0)

    const perTier = tiers.map(t => {
      const members = active.filter(f => f.tierId === t.id)
      const onTrack = members.filter(f => urgency(f, tiers) < 1).length
      return { tier: t, total: members.length, onTrack }
    }).filter(r => r.total > 0)

    // One number for "am I keeping up?": share of eligible friends not yet due.
    const health = active.length
      ? Math.round((active.filter(f => urgency(f, tiers) < 1).length / active.length) * 100)
      : 100

    return {
      active, behind, meetups: occasions.length, groupOccasions, mostSeen,
      perTier, perTag, perKind, totals, alwaysMe, health,
    }
  }, [friends, tiers, tags, kinds, period])

  if (!friends.length) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Add friends to see stats.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
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
      {stats.groupOccasions > 0 && (
        <p className="text-[11px] text-slate-500 -mt-2 px-1">
          {stats.groupOccasions} of them {stats.groupOccasions === 1 ? 'was' : 'were'} with several friends at once.
        </p>
      )}

      {stats.behind.length > 0 && (
        <section className="card p-4">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">Furthest behind</h3>
          <div className="space-y-2">
            {stats.behind.map(friend => {
              const tier = tierOf(friend, tiers)
              return (
                <button
                  key={friend.id}
                  onClick={() => ui.openFriend(friend)}
                  className="w-full flex items-center gap-2.5 text-left hover:bg-slate-800/60 rounded-lg px-1 py-1 transition-colors"
                >
                  <Avatar name={friend.name} size={24} />
                  <span className="text-sm w-24 shrink-0 truncate">{friend.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progressOf(friend, tiers)}%`,
                        backgroundColor: tier?.color ?? 'var(--accent)',
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {stats.totals.known > 0 && (
        <section className="card p-4">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">Who reaches out</h3>
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
            <div style={{ width: `${(stats.totals.me / stats.totals.known) * 100}%`,     backgroundColor: 'var(--accent)' }} />
            <div style={{ width: `${(stats.totals.mutual / stats.totals.known) * 100}%`, backgroundColor: '#64748b' }} />
            <div style={{ width: `${(stats.totals.them / stats.totals.known) * 100}%`,   backgroundColor: '#475569' }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>You {Math.round((stats.totals.me / stats.totals.known) * 100)}%</span>
            <span className="text-slate-500">{stats.totals.known} logged</span>
            <span>Them {Math.round((stats.totals.them / stats.totals.known) * 100)}%</span>
          </div>

          {stats.alwaysMe.length > 0 && (
            <>
              <p className="text-[11px] text-amber-400 mt-3 mb-1.5">You do most of the reaching out with:</p>
              <div className="space-y-1">
                {stats.alwaysMe.map(({ friend, r }) => (
                  <button
                    key={friend.id}
                    onClick={() => ui.openFriend(friend)}
                    className="w-full flex items-center gap-2.5 text-left hover:bg-slate-800/60 rounded-lg px-1 py-1 transition-colors"
                  >
                    <Avatar name={friend.name} size={24} />
                    <span className="text-sm flex-1 truncate">{friend.name}</span>
                    <span className="text-xs text-slate-400">{r.me}/{r.known}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {stats.perKind.length > 0 && (
        <section className="card p-4">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">By kind of hangout</h3>
          <div className="space-y-2">
            {stats.perKind.map(({ kind, count }) => (
              <div key={kind.id} className="flex items-center gap-2">
                <span className="text-xs w-24 shrink-0 truncate" style={{ color: kind.color }}>{kind.name}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(count / stats.perKind[0]!.count) * 100}%`,
                      backgroundColor: kind.color,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.perTag.length > 0 && (
        <section className="card p-4">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">By circle</h3>
          <div className="space-y-2">
            {stats.perTag.map(({ tag, total, onTrack }) => (
              <div key={tag.id} className="flex items-center gap-2">
                <span className="text-xs w-24 shrink-0 truncate" style={{ color: tag.color }}>{tag.name}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(onTrack / total) * 100}%`, backgroundColor: tag.color }} />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{onTrack}/{total}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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
                <Avatar name={friend.name} size={26} />
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
