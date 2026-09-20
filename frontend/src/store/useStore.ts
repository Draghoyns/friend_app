import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Friend, FriendCreate, FriendUpdate, MeetupCreate, Tab, Tier } from '@/types'
import { DEFAULT_TIERS } from '@/lib/scoring'
import { today, toLocalDateStr } from '@/lib/dates'

const genId = () => Date.now() + Math.floor(Math.random() * 1000)

interface AppStore {
  friends: Friend[]
  tiers:   Tier[]

  activeTab:   Tab
  sidebarOpen: boolean
  theme:       'dark' | 'light'
  accentColor: string
  showPaused:  boolean
  notificationsEnabled: boolean
  notificationHour:     number
  notificationMinute:   number
  /** Weekday for the weekly nudge, 0 = Sunday. */
  notificationWeekday:  number
  newFriendTrigger:     number

  setActiveTab:   (tab: Tab) => void
  setSidebarOpen: (v: boolean) => void
  setTheme:       (t: 'dark' | 'light') => void
  setAccentColor: (c: string) => void
  setShowPaused:  (v: boolean) => void
  setNotificationsEnabled: (v: boolean) => void
  setNotificationTime:     (hour: number, minute: number) => void
  setNotificationWeekday:  (d: number) => void
  triggerNewFriend: () => void

  createFriend: (data: FriendCreate) => Friend
  updateFriend: (id: number, data: FriendUpdate) => void
  deleteFriend: (id: number) => void
  /** Log a meetup. Returns the updated friend. */
  logMeetup:    (friendId: number, data: MeetupCreate) => void
  deleteMeetup: (friendId: number, meetupId: number) => void
  /** Push a friend out of the suggestions for N days. */
  snooze:       (friendId: number, days: number) => void
  unsnooze:     (friendId: number) => void

  createTier: (data: Omit<Tier, 'id' | 'builtin'>) => Tier
  updateTier: (id: string, data: Partial<Omit<Tier, 'id'>>) => void
  /** Deleting a tier moves its friends to `fallbackTierId`. */
  deleteTier: (id: string, fallbackTierId: string) => void

  exportData: () => string
  importData: (json: string) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      friends: [],
      tiers:   DEFAULT_TIERS,

      activeTab:   'orbit',
      sidebarOpen: false,
      theme:       'dark',
      accentColor: '#38bdf8',
      showPaused:  false,
      notificationsEnabled: false,
      notificationHour:     18,
      notificationMinute:   0,
      notificationWeekday:  0,
      newFriendTrigger:     0,

      setActiveTab:   tab => set({ activeTab: tab }),
      setSidebarOpen: v   => set({ sidebarOpen: v }),
      setTheme:       t   => set({ theme: t }),
      setAccentColor: c   => set({ accentColor: c }),
      setShowPaused:  v   => set({ showPaused: v }),
      setNotificationsEnabled: v => set({ notificationsEnabled: v }),
      setNotificationTime: (hour, minute) => set({ notificationHour: hour, notificationMinute: minute }),
      setNotificationWeekday: d => set({ notificationWeekday: d }),
      triggerNewFriend: () => set(s => ({ newFriendTrigger: s.newFriendTrigger + 1 })),

      createFriend: data => {
        const friend: Friend = {
          meetups: [],
          addedAt: today(),
          ...data,
          id: genId(),
        }
        set(s => ({ friends: [...s.friends, friend] }))
        return friend
      },

      updateFriend: (id, data) =>
        set(s => ({ friends: s.friends.map(f => (f.id === id ? { ...f, ...data } : f)) })),

      deleteFriend: id => set(s => ({ friends: s.friends.filter(f => f.id !== id) })),

      logMeetup: (friendId, data) =>
        set(s => ({
          friends: s.friends.map(f =>
            f.id === friendId
              ? {
                  ...f,
                  // Logging a meetup always clears a snooze — the point of the
                  // snooze was to wait until you'd seen them.
                  snoozedUntil: null,
                  meetups: [...f.meetups, { ...data, id: genId() }].sort((a, b) =>
                    a.date < b.date ? 1 : -1,
                  ),
                }
              : f,
          ),
        })),

      deleteMeetup: (friendId, meetupId) =>
        set(s => ({
          friends: s.friends.map(f =>
            f.id === friendId ? { ...f, meetups: f.meetups.filter(m => m.id !== meetupId) } : f,
          ),
        })),

      snooze: (friendId, days) => {
        const until = new Date()
        until.setDate(until.getDate() + days)
        set(s => ({
          friends: s.friends.map(f =>
            f.id === friendId ? { ...f, snoozedUntil: toLocalDateStr(until) } : f,
          ),
        }))
      },

      unsnooze: friendId =>
        set(s => ({
          friends: s.friends.map(f => (f.id === friendId ? { ...f, snoozedUntil: null } : f)),
        })),

      createTier: data => {
        const tier: Tier = { ...data, id: `tier-${genId()}` }
        set(s => ({ tiers: [...s.tiers, tier].sort((a, b) => a.intervalDays - b.intervalDays) }))
        return tier
      },

      updateTier: (id, data) =>
        set(s => ({
          tiers: s.tiers
            .map(t => (t.id === id ? { ...t, ...data } : t))
            .sort((a, b) => a.intervalDays - b.intervalDays),
        })),

      deleteTier: (id, fallbackTierId) =>
        set(s => ({
          tiers:   s.tiers.filter(t => t.id !== id),
          friends: s.friends.map(f => (f.tierId === id ? { ...f, tierId: fallbackTierId } : f)),
        })),

      exportData: () =>
        JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), friends: get().friends, tiers: get().tiers }, null, 2),

      importData: json => {
        const data = JSON.parse(json)
        if (!Array.isArray(data.friends)) throw new Error('Not an Orbit backup: no "friends" array')
        set({
          friends: data.friends,
          tiers:   Array.isArray(data.tiers) && data.tiers.length ? data.tiers : DEFAULT_TIERS,
        })
      },
    }),
    {
      name: 'orbit-store',
      // Bump when the persisted shape changes so old phones migrate cleanly.
      version: 1,
    },
  ),
)
