import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { useStore } from '@/store/useStore'
import { UiContext } from '@/lib/ui'
import type { Friend, FriendCreate } from '@/types'
import { scheduleWeeklyNudge } from '@/hooks/useLocalNotifications'
import Header             from '@/components/layout/Header'
import OrbitTab           from '@/components/OrbitTab'
import FriendsTab         from '@/components/FriendsTab'
import TimelineTab        from '@/components/TimelineTab'
import StatsTab           from '@/components/StatsTab'
import Sidebar            from '@/components/Sidebar'
import FriendModal        from '@/components/FriendModal'
import LogMeetupModal     from '@/components/LogMeetupModal'
import ContactImportModal from '@/components/ContactImportModal'

type Modal =
  | { kind: 'friend'; friend: Friend }
  | { kind: 'new'; draft?: Partial<FriendCreate> }
  | { kind: 'log'; friend: Friend }
  | { kind: 'import' }
  | null

export default function App() {
  const { activeTab, sidebarOpen, theme, accentColor, setActiveTab, setSidebarOpen, friends, tiers,
          notificationsEnabled, notificationHour, notificationMinute, notificationWeekday } = useStore()
  const [modal, setModal] = useState<Modal>(null)
  // Mirror of `modal` for listeners that must read it synchronously (the
  // Android back button fires outside React's render cycle).
  const modalRef = useRef<Modal>(null)
  modalRef.current = modal

  // The open friend must track the store, otherwise logging a meetup from
  // inside the editor leaves a stale copy on screen.
  const openFriend = modal && 'friend' in modal
    ? friends.find(f => f.id === modal.friend.id) ?? null
    : null

  const ui = {
    openFriend: (f: Friend) => setModal({ kind: 'friend', friend: f }),
    openNew:    (draft?: Partial<FriendCreate>) => setModal({ kind: 'new', draft }),
    openLog:    (f: Friend) => setModal({ kind: 'log', friend: f }),
    openImport: () => setModal({ kind: 'import' }),
  }

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  // Re-arm the weekly nudge whenever the app comes to the foreground, so its
  // body always lists the friends who are actually overdue right now.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const rearm = () => {
      const st = useStore.getState()
      if (st.notificationsEnabled) {
        scheduleWeeklyNudge(st.notificationWeekday, st.notificationHour, st.notificationMinute, st.friends, st.tiers)
      }
    }
    rearm()
    const promise = CapApp.addListener('appStateChange', ({ isActive }) => { if (isActive) rearm() })
    return () => { promise.then(h => h.remove()).catch(() => {}) }
  }, [notificationsEnabled, notificationHour, notificationMinute, notificationWeekday, friends, tiers])

  // Android back button: close the top-most layer instead of quitting.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    window.history.pushState({ capBack: true }, '')
    function onPopState() {
      window.history.pushState({ capBack: true }, '')
      if (useStore.getState().sidebarOpen) { setSidebarOpen(false); return }
      if (modalRef.current) { setModal(null); return }
      CapApp.minimizeApp()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Keyboard shortcuts — desktop only in practice, ignored while typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setModal({ kind: 'new' })
      } else if (e.key === '/') {
        e.preventDefault()
        setActiveTab('friends')
        setTimeout(() => document.getElementById('friend-search')?.focus(), 50)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <UiContext.Provider value={ui}>
      <div className="flex flex-col h-full">
        <Header />
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'orbit'    ? <OrbitTab />
           : activeTab === 'friends' ? <FriendsTab />
           : activeTab === 'timeline' ? <TimelineTab />
           : <StatsTab />}
        </main>

        {sidebarOpen && <Sidebar />}

        {modal?.kind === 'friend' && openFriend && (
          <FriendModal friend={openFriend} onClose={() => setModal(null)} onLog={ui.openLog} />
        )}
        {modal?.kind === 'new' && (
          <FriendModal draft={modal.draft} onClose={() => setModal(null)} onLog={ui.openLog} />
        )}
        {modal?.kind === 'log' && openFriend && (
          <LogMeetupModal friend={openFriend} onClose={() => setModal(null)} />
        )}
        {modal?.kind === 'import' && (
          <ContactImportModal
            onClose={() => setModal(null)}
            onPicked={draft => setModal({ kind: 'new', draft })}
          />
        )}
      </div>
    </UiContext.Provider>
  )
}
