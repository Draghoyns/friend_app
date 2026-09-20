import type { Friend, Tier, Freshness } from '@/types'
import { daysBetween, today } from './dates'

export const DEFAULT_TIERS: Tier[] = [
  { id: 'inner',        name: 'Inner circle',   intervalDays:  14, color: '#f43f5e', builtin: true },
  { id: 'close',        name: 'Close friend',   intervalDays:  30, color: '#f59e0b', builtin: true },
  { id: 'good',         name: 'Good friend',    intervalDays:  75, color: '#38bdf8', builtin: true },
  { id: 'friendly',     name: 'Friendly',       intervalDays: 150, color: '#a78bfa', builtin: true },
  { id: 'acquaintance', name: 'Acquaintance',   intervalDays: 365, color: '#64748b', builtin: true },
]

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

export function freshnessOf(ratio: number): Freshness {
  if (ratio < 0.6)  return 'fresh'
  if (ratio < 0.9)  return 'soon'
  if (ratio < 1.25) return 'due'
  return 'overdue'
}

export const FRESHNESS_META: Record<Freshness, { label: string; text: string; bg: string; dot: string }> = {
  fresh:   { label: 'Fresh',   text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: '#10b981' },
  soon:    { label: 'Soon',    text: 'text-sky-400',     bg: 'bg-sky-500/10',     dot: '#38bdf8' },
  due:     { label: 'Due',     text: 'text-amber-400',   bg: 'bg-amber-500/10',   dot: '#f59e0b' },
  overdue: { label: 'Overdue', text: 'text-rose-400',    bg: 'bg-rose-500/10',    dot: '#f43f5e' },
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

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
}
