import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import type { Friend, Tier } from '@/types'
import { ranked, urgency } from '@/lib/scoring'

const NUDGE_ID = 1001

/** Schedule the weekly "who to see" nudge. Safe to call repeatedly — it
 *  cancels the previous one first, which also refreshes the body text. */
export async function scheduleWeeklyNudge(
  weekday: number, hour: number, minute: number, friends: Friend[], tiers: Tier[],
) {
  if (!Capacitor.isNativePlatform()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')

  await LocalNotifications.cancel({ notifications: [{ id: NUDGE_ID }] }).catch(() => {})

  const due = ranked(friends, tiers).filter(f => urgency(f, tiers) >= 1)
  const body = due.length
    ? due.slice(0, 3).map(f => `· ${f.name}`).join('\n')
    : 'Everyone is up to date. Keep it that way.'

  await LocalNotifications.schedule({
    notifications: [{
      id:    NUDGE_ID,
      title: due.length ? `${due.length} ${due.length === 1 ? 'friend' : 'friends'} to catch up with` : 'Orbit',
      body,
      schedule: { on: { weekday: weekday + 1, hour, minute }, allowWhileIdle: true },
    }],
  })
}

export async function cancelWeeklyNudge() {
  if (!Capacitor.isNativePlatform()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.cancel({ notifications: [{ id: NUDGE_ID }] }).catch(() => {})
}

export function useNotificationPermission() {
  const [granted, setGranted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    import('@capacitor/local-notifications')
      .then(({ LocalNotifications }) => LocalNotifications.checkPermissions())
      .then(p => setGranted(p.display === 'granted'))
      .catch(() => {})
  }, [])

  async function request(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false
    setLoading(true)
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const p = await LocalNotifications.requestPermissions()
      const ok = p.display === 'granted'
      setGranted(ok)
      return ok
    } finally {
      setLoading(false)
    }
  }

  return { granted, loading, request, isNative: Capacitor.isNativePlatform() }
}
