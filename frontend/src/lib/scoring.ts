import type { Friend, Initiator, Meetup, MeetupEntry, Tag, Tier } from '@/types'
import { daysBetween, today } from './dates'

/** Shared swatches for accents, tiers and tags. */
export const PALETTE = ['#38bdf8', '#ec4899', '#a78bfa', '#34d399', '#f59e0b', '#f43f5e', '#22d3ee', '#fb923c']

export const DEFAULT_TIERS: Tier[] = [
  { id: 'inner',        name: 'Inner circle',   intervalDays:  30, color: '#f43f5e', builtin: true },
  { id: 'close',        name: 'Close friend',   intervalDays:  60, color: '#f59e0b', builtin: true },
  { id: 'good',         name: 'Good friend',    intervalDays: 120, color: '#38bdf8', builtin: true },
  { id: 'friendly',     name: 'Friendly',       intervalDays: 240, color: '#a78bfa', builtin: true },
  { id: 'acquaintance', name: 'Acquaintance',   intervalDays: 365, color: '#64748b', builtin: true },
]

/**
 * What the built-in levels used to be, before the ladder was stretched so that
 * nothing asks for more than one meetup a month. Used by the store migration to
 * re-time levels the user never touched, while leaving edited ones alone.
 */
export const LEGACY_TIER_INTERVALS: Record<string, number> = {
  inner: 14, close: 30, good: 75, friendly: 150,
}

/** Handy targets for the frequency picker, in days. */
export const INTERVAL_PRESETS: number[] = [7, 14, 30, 60, 90, 180, 365]

/** The target gap between meetups for this friend, in days. */
export function intervalOf(friend: Friend, tiers: Tier[]): number {
  if (friend.customIntervalDays && friend.customIntervalDays > 0) return friend.customIntervalDays
  return tiers.find(t => t.id === friend.tierId)?.intervalDays ?? 90
}

export function tierOf(friend: Friend, tiers: Tier[]): Tier | undefined {
  return tiers.find(t => t.id === friend.tierId)
}

/** Most recent meetup date, or null if you have never logged one. */
export function lastSeen(friend: Friend): string | null {
  if (!friend.meetups.length) return null
  return friend.meetups.reduce((a, m) => (m.date > a ? m.date : a), friend.meetups[0].date)
}

/** Days since the last meetup — or since the friend was added, if never seen. */
export function daysSinceSeen(friend: Friend): number {
  return Math.max(0, daysBetween(lastSeen(friend) ?? friend.addedAt, today()))
}

/**
 * How overdue a friend is, normalised by their tier.
 * 0 = just seen · 1 = exactly on schedule · >1 = overdue.
 * This is the number every ranking in the app sorts by, so a neglected
 * acquaintance never outranks a close friend you saw last month.
 */
export function urgency(friend: Friend, tiers: Tier[]): number {
  return daysSinceSeen(friend) / intervalOf(friend, tiers)
}

/** How far through the interval a friend is, 0–100, for the progress bar. */
export function progressOf(friend: Friend, tiers: Tier[]): number {
  return Math.min(100, Math.round(urgency(friend, tiers) * 100))
}

/** Past their interval — the one distinction the app still draws. */
export function isOverdue(friend: Friend, tiers: Tier[]): boolean {
  return urgency(friend, tiers) >= 1
}

/** Days remaining until the friend is "due". Negative when overdue. */
export function daysUntilDue(friend: Friend, tiers: Tier[]): number {
  return intervalOf(friend, tiers) - daysSinceSeen(friend)
}

/** A friend is eligible for a suggestion unless paused or snoozed. */
export function isEligible(friend: Friend): boolean {
  if (friend.paused) return false
  if (friend.snoozedUntil && friend.snoozedUntil > today()) return false
  return true
}

/** Everyone eligible, most overdue first. */
export function ranked(friends: Friend[], tiers: Tier[]): Friend[] {
  return friends
    .filter(isEligible)
    .sort((a, b) => urgency(b, tiers) - urgency(a, tiers))
}

export function tagsOf(friend: Friend, tags: Tag[]): Tag[] {
  return friend.tagIds.map(id => tags.find(t => t.id === id)).filter((t): t is Tag => !!t)
}

/** The kinds of hangout recorded against one meetup. */
export function kindsOf(meetup: Meetup, kinds: Tag[]): Tag[] {
  return (meetup.kindIds ?? []).map(id => kinds.find(k => k.id === id)).filter((k): k is Tag => !!k)
}

/** Kinds Orbit creates on its own when you log a call or a text in one tap. */
export const CALL_KIND = 'call'
export const TEXT_KIND = 'text'

export interface Reciprocity {
  me:     number
  them:   number
  mutual: number
  /** Meetups with a recorded initiator. */
  known:  number
  /** Share of known meetups you started, 0–1. Null when nothing is recorded. */
  share:  number | null
}

/** Who has been doing the reaching out. */
export function reciprocity(friend: Friend): Reciprocity {
  const count = (k: Initiator) => friend.meetups.filter(m => m.initiator === k).length
  const me = count('me'), them = count('them'), mutual = count('mutual')
  const known = me + them + mutual
  return { me, them, mutual, known, share: known ? me / known : null }
}

/** Plain-English read on a reciprocity balance, or null when it's even or unknown. */
export function reciprocityHint(r: Reciprocity, name: string): string | null {
  if (r.share === null || r.known < 3) return null
  if (r.share >= 0.8)  return `You start almost every meetup with ${name}.`
  if (r.share >= 0.65) return `You usually reach out first.`
  if (r.share <= 0.2)  return `${name} does almost all the reaching out.`
  if (r.share <= 0.35) return `${name} usually reaches out first.`
  return null
}

export const INITIATOR_LABEL: Record<Initiator, string> = {
  me:     'I reached out',
  them:   'They reached out',
  mutual: 'Mutual',
}

/**
 * Collapse every friend's meetups into shared entries: one per evening, with
 * everyone who was there. Copies of a group meetup share a groupId.
 */
export function meetupEntries(friends: Friend[]): MeetupEntry[] {
  const groups = new Map<string, MeetupEntry>()
  const solo: MeetupEntry[] = []

  for (const friend of friends) {
    for (const meetup of friend.meetups) {
      if (!meetup.groupId) { solo.push({ meetup, friends: [friend] }); continue }
      const entry = groups.get(meetup.groupId)
      if (entry) entry.friends.push(friend)
      else groups.set(meetup.groupId, { meetup, friends: [friend] })
    }
  }

  return [...groups.values(), ...solo].sort((a, b) => (a.meetup.date < b.meetup.date ? 1 : -1))
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
}
