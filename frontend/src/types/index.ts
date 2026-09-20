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

/** A free-form circle a friend belongs to — work, climbing, school… */
export interface Tag {
  id:    string
  name:  string
  color: string
}

/** Who made this meetup happen. */
export type Initiator = 'me' | 'them' | 'mutual'

export interface Meetup {
  id:      number
  /** YYYY-MM-DD, local. */
  date:    string
  place?:  string
  note?:   string
  initiator?: Initiator
  /** Shared by every copy of a meetup that involved several friends. */
  groupId?: string
}

export interface Friend {
  id:        number
  name:      string
  tierId:    string
  tagIds:    string[]
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

export type FriendCreate = Omit<Friend, 'id' | 'addedAt' | 'meetups' | 'tagIds'> &
  Partial<Pick<Friend, 'addedAt' | 'meetups' | 'tagIds'>>
export type FriendUpdate = Partial<Omit<Friend, 'id'>>

export type MeetupCreate = Omit<Meetup, 'id' | 'groupId'>

/** One logged meetup, resolved back to everyone who was there. */
export interface MeetupEntry {
  meetup:  Meetup
  friends: Friend[]
}

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
