import { createContext, useContext } from 'react'
import type { Friend, FriendCreate } from '@/types'

/** Modal plumbing lives in App; tabs reach it through this context instead of
 *  drilling callbacks through every list. */
export interface UiActions {
  /** Read-first detail sheet for an existing friend. */
  openFriend: (f: Friend) => void
  /** The edit form — for an existing friend, or a prefilled new one. */
  openEdit:   (f: Friend) => void
  openNew:    (draft?: Partial<FriendCreate>) => void
  /** Log a meetup, optionally pre-attended by these friends. */
  openLog:    (f?: Friend) => void
  openImport: () => void
}

export const UiContext = createContext<UiActions | null>(null)

export function useUi(): UiActions {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside <UiContext.Provider>')
  return ctx
}
