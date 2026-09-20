import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Friend, FriendCreate, FriendUpdate, MeetupCreate, Tab, Tag, Tier } from '@/types'
import { DEFAULT_TIERS, PALETTE } from '@/lib/scoring'
import { today, toLocalDateStr } from '@/lib/dates'

const genId = () => Date.now() + Math.floor(Math.random() * 1000)
const genKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

interface AppStore {
  friends: Friend[]
  tiers:   Tier[]
  tags:    Tag[]

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

  setActiveTab:   (tab: Tab) => void
  setSidebarOpen: (v: boolean) => void
  setTheme:       (t: 'dark' | 'light') => void
  setAccentColor: (c: string) => void
  setShowPaused:  (v: boolean) => void
  setNotificationsEnabled: (v: boolean) => void
  setNotificationTime:     (hour: number, minute: number) => void
  setNotificationWeekday:  (d: number) => void

  createFriend: (data: FriendCreate) => Friend
  updateFriend: (id: number, data: FriendUpdate) => void
  deleteFriend: (id: number) => void

  /** Log one meetup against one or several friends. Everyone present gets
   *  their own copy, linked by a shared groupId so the timeline can show the
   *  evening as a single entry. */
  logMeetup:      (friendIds: number[], data: MeetupCreate) => void
  updateMeetup:   (friendId: number, meetupId: number, data: Partial<MeetupCreate>) => void
  /** Deleting a group meetup removes every copy of it. */
  deleteMeetup:   (friendId: number, meetupId: number) => void

  /** Push a friend out of the suggestions for N days. */
  snooze:      (friendId: number, days: number) => void
  snoozeUntil: (friendId: number, date: string) => void
  unsnooze:    (friendId: number) => void

  createTier: (data: Omit<Tier, 'id' | 'builtin'>) => Tier
  updateTier: (id: string, data: Partial<Omit<Tier, 'id'>>) => void
  /** Deleting a tier moves its friends to `fallbackTierId`. */
  deleteTier: (id: string, fallbackTierId: string) => void

  createTag:   (name: string, color?: string) => Tag | null
  updateTag:   (id: string, data: Partial<Omit<Tag, 'id'>>) => void
  /** Deleting a tag detaches it from every friend. */
  deleteTag:   (id: string) => void
  toggleTag:   (friendId: number, tagId: string) => void

  exportData: () => string
  importData: (json: string) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      friends: [],
      tiers:   DEFAULT_TIERS,
      tags:    [],

      activeTab:   'orbit',
      sidebarOpen: false,
      theme:       'dark',
      accentColor: '#38bdf8',
      showPaused:  false,
      notificationsEnabled: false,
      notificationHour:     18,
      notificationMinute:   0,
      notificationWeekday:  0,

      setActiveTab:   tab => set({ activeTab: tab }),
      setSidebarOpen: v   => set({ sidebarOpen: v }),
      setTheme:       t   => set({ theme: t }),
      setAccentColor: c   => set({ accentColor: c }),
      setShowPaused:  v   => set({ showPaused: v }),
      setNotificationsEnabled: v => set({ notificationsEnabled: v }),
      setNotificationTime: (hour, minute) => set({ notificationHour: hour, notificationMinute: minute }),
      setNotificationWeekday: d => set({ notificationWeekday: d }),

      createFriend: data => {
        const friend: Friend = {
          meetups: [],
          tagIds:  [],
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

      logMeetup: (friendIds, data) => {
        const ids     = [...new Set(friendIds)]
        const groupId = ids.length > 1 ? genKey() : undefined
        set(s => ({
          friends: s.friends.map(f =>
            ids.includes(f.id)
              ? {
                  ...f,
                  // Logging a meetup always clears a snooze — the point of the
                  // snooze was to wait until you'd seen them.
                  snoozedUntil: null,
                  meetups: [...f.meetups, { ...data, id: genId(), groupId }]
                    .sort((a, b) => (a.date < b.date ? 1 : -1)),
                }
              : f,
          ),
        }))
      },

      updateMeetup: (friendId, meetupId, data) => {
        const groupId = get().friends
          .find(f => f.id === friendId)?.meetups
          .find(m => m.id === meetupId)?.groupId
        set(s => ({
          friends: s.friends.map(f => ({
            ...f,
            meetups: f.meetups
              .map(m =>
                (f.id === friendId && m.id === meetupId) || (groupId && m.groupId === groupId)
                  ? { ...m, ...data }
                  : m,
              )
              .sort((a, b) => (a.date < b.date ? 1 : -1)),
          })),
        }))
      },

      deleteMeetup: (friendId, meetupId) => {
        const groupId = get().friends
          .find(f => f.id === friendId)?.meetups
          .find(m => m.id === meetupId)?.groupId
        set(s => ({
          friends: s.friends.map(f => ({
            ...f,
            meetups: f.meetups.filter(m =>
              groupId ? m.groupId !== groupId : !(f.id === friendId && m.id === meetupId),
            ),
          })),
        }))
      },

      snooze: (friendId, days) => {
        const until = new Date()
        until.setDate(until.getDate() + days)
        get().snoozeUntil(friendId, toLocalDateStr(until))
      },

      snoozeUntil: (friendId, date) =>
        set(s => ({
          friends: s.friends.map(f => (f.id === friendId ? { ...f, snoozedUntil: date } : f)),
        })),

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

      createTag: (name, color) => {
        const trimmed = name.trim()
        if (!trimmed) return null
        // Tag names are the handle you filter by, so keep them unique.
        const existing = get().tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase())
        if (existing) return existing
        const tag: Tag = {
          id:    `tag-${genId()}`,
          name:  trimmed,
          color: color ?? PALETTE[get().tags.length % PALETTE.length]!,
        }
        set(s => ({ tags: [...s.tags, tag] }))
        return tag
      },

      updateTag: (id, data) =>
        set(s => ({ tags: s.tags.map(t => (t.id === id ? { ...t, ...data } : t)) })),

      deleteTag: id =>
        set(s => ({
          tags:    s.tags.filter(t => t.id !== id),
          friends: s.friends.map(f => ({ ...f, tagIds: f.tagIds.filter(t => t !== id) })),
        })),

      toggleTag: (friendId, tagId) =>
        set(s => ({
          friends: s.friends.map(f =>
            f.id === friendId
              ? {
                  ...f,
                  tagIds: f.tagIds.includes(tagId)
                    ? f.tagIds.filter(t => t !== tagId)
                    : [...f.tagIds, tagId],
                }
              : f,
          ),
        })),

      exportData: () =>
        JSON.stringify(
          { version: 2, exportedAt: new Date().toISOString(), friends: get().friends, tiers: get().tiers, tags: get().tags },
          null, 2,
        ),

      importData: json => {
        const data = JSON.parse(json)
        if (!Array.isArray(data.friends)) throw new Error('Not an Orbit backup: no "friends" array')
        set({
          friends: data.friends.map((f: Friend) => ({ ...f, tagIds: f.tagIds ?? [] })),
          tiers:   Array.isArray(data.tiers) && data.tiers.length ? data.tiers : DEFAULT_TIERS,
          tags:    Array.isArray(data.tags) ? data.tags : [],
        })
      },
    }),
    {
      name: 'orbit-store',
      // Bump when the persisted shape changes so old phones migrate cleanly.
      version: 2,
      migrate: (state: unknown, from: number) => {
        const s = state as { friends?: Friend[]; tags?: Tag[] }
        if (from < 2) {
          s.friends = (s.friends ?? []).map(f => ({ ...f, tagIds: f.tagIds ?? [] }))
          s.tags = s.tags ?? []
        }
        return s
      },
    },
  ),
)
