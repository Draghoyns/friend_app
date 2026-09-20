/** A friendship level. Drives how often you want to see someone. */
export interface Tier {
  id:           string
  name:         string
  /** Target number of days between two meetups. */
  intervalDays: number
  color:        string
  /** Built-in tiers cannot be deleted, only edited. */
  builtin?:     boolean
}

export interface Meetup {
  id:      number
  /** YYYY-MM-DD, local. */
  date:    string
  place?:  string
  note?:   string
}

export interface Friend {
  id:        number
  name:      string
  tierId:    string
  /** Per-friend override of the tier interval, in days. */
  customIntervalDays?: number | null
  phone?:    string
  email?:    string
  /** Data-URI avatar, when imported from contacts. */
  photo?:    string
  notes?:    string
  /** YYYY-MM-DD — the day this friend entered the app; the clock starts here
   *  when there is no meetup logged yet. */
  addedAt:   string
  /** Ignore this friend in suggestions until this date (YYYY-MM-DD). */
  snoozedUntil?: string | null
  /** Permanently excluded from suggestions but kept in the list. */
  paused?:   boolean
  meetups:   Meetup[]
  source:    'manual' | 'contacts'
}

export type FriendCreate = Omit<Friend, 'id' | 'addedAt' | 'meetups'> &
  Partial<Pick<Friend, 'addedAt' | 'meetups'>>
export type FriendUpdate = Partial<Omit<Friend, 'id'>>

export type MeetupCreate = Omit<Meetup, 'id'>

/** A contact as returned by the OS contact picker. */
export interface ImportedContact {
  key:    string
  name:   string
  phone?: string
  email?: string
  photo?: string
}

export type Freshness = 'fresh' | 'soon' | 'due' | 'overdue'
export type Tab = 'orbit' | 'friends' | 'timeline' | 'stats'
