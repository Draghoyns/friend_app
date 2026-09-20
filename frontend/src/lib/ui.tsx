import { createContext, useContext } from 'react'
import type { Friend, FriendCreate } from '@/types'

/** Modal plumbing lives in App; tabs reach it through this context instead of
 *  drilling four callbacks through every list. */
export interface UiActions {
  openFriend: (f: Friend) => void
  openNew:    (draft?: Partial<FriendCreate>) => void
  openLog:    (f: Friend) => void
  openImport: () => void
}

export const UiContext = createContext<UiActions | null>(null)

export function useUi(): UiActions {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside <UiContext.Provider>')
  return ctx
}
