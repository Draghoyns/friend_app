# Orbit — project instructions

An app that remembers the last time you saw each friend and tells you **who to see next**.
Phone-first (iOS/Android via Capacitor); the browser build is for development.

---

## Git workflow — review before merge

**Never merge a branch to main without explicit user approval.** The user must be able to test
each feature on its branch before it lands. Merging unasked is a workflow violation.

1. **Branch** — one per feature/fix: `feat/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>`
2. **Commit** — atomic commits grouped by concern (see the `git-ritual` skill)
3. **Stop** — when the feature is done, commit and stop. Do not merge. Do not push.
4. **Report** — say plainly that the branch is ready to test, and what to look at
5. **Wait** — do not touch main, do not start the next feature automatically
6. **Merge only on the word** — when the user says "merge" / "looks good, merge it", run the
   `git-merge` skill

This applies to every branch type. Size is irrelevant — a one-line fix still needs approval.
Working through several features means one at a time, each reviewed before its merge; never
batch-merge at the end of a session.

### A branch is complete when

- All changes are committed and `git status` is clean
- `npx tsc --noEmit` exits 0 (run it from `frontend/`)
- `just build` succeeds — run it and verify, don't assume
- The user has been told it is ready to test

`just android` needs a USB device and the Android SDK, so it is not part of "complete" — run it
only when the change touches native behaviour and a device is connected.

### Never

- Merge straight after finishing development without being asked
- Ask "should I merge?" and read silence as yes
- Squash-merge from the feature branch (always switch to main first)
- Run `git push` — that is the user's call, always

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 · TypeScript · Vite · Tailwind |
| State | Zustand `persist` → device localStorage |
| Mobile | Capacitor 6 (iOS + Android) |
| Native | `@capacitor-community/contacts` · `@capacitor/local-notifications` |

**There is no backend.** No accounts, no server, no network calls — and no outbound links either:
actions like "I called" log inside the app rather than opening a dialler or mail client. Keep it
that way.

## Layout — `frontend/src/`

| Path | Purpose |
|------|---------|
| `App.tsx` | Root: header, active tab, sidebar, modals, floating log button |
| `types/index.ts` | Every shared type: `Friend`, `Meetup`, `Tier`, `Tag`, `Tab` |
| `store/useStore.ts` | Zustand store — all state and actions, persisted, with versioned `migrate` |
| `lib/scoring.ts` | Ranking maths, default levels, palette, derived helpers |
| `lib/dates.ts` | Local-date parsing and human formatting — never use raw `Date` strings elsewhere |
| `lib/contacts.ts` | Address-book import; **phone build only** |
| `lib/ui.tsx` | `UiContext` — how tabs open modals without prop drilling |
| `hooks/useLocalNotifications.ts` | Weekly nudge scheduling |

### Tabs

`OrbitTab` (who next) · `FriendsTab` · `LevelsTab` · `TimelineTab` · `StatsTab`, switched by
`activeTab` in the store and listed in `layout/Header.tsx`. Adding a tab means touching the `Tab`
union, the header list and the switch in `App.tsx`.

### The model

- **Friend** — a name, a level, circles, an optional custom rhythm, notes, meetups. Nothing else:
  no photo, no phone, no email.
- **Tier** ("friendship level") — carries `intervalDays`, the target gap between meetups. The store
  keeps tiers sorted by interval.
- **Tag** — one shape, two separate vocabularies: `tags` are **circles** on a friend (work,
  climbing), `kinds` are **kinds of hangout** on a meetup (dinner, coffee, call). Both free-form.
- **Meetup** — date, optional place/note/kinds/initiator. A `groupId` links the copies held by
  everyone who was there, so the timeline shows one occasion.

### The ranking

```
urgency = days since last meetup / target interval for that friend
```

`1.0` is exactly on schedule, above is overdue; every ranking sorts by it. A friend never seen
counts from `addedAt`.

## Conventions

- Progress bars, not labels. Orbit does not grade friendships as Fresh/Due/Overdue — show how far
  through the interval someone is and let the bar speak.
- Take colors from the friend's tier, or `var(--accent)`; the palette lives in `lib/scoring.ts`.
- Reuse the `.btn`, `.card`, `.input`, `.label` component classes in `index.css`.
- Phone-first: thumb-sized targets, works at 360px wide, no hover-only affordances.
- Changing the persisted shape means bumping `version` in the store and adding a `migrate` branch.
  Migrations must not clobber settings the user has tuned by hand.

## Commands

```bash
just dev        # dev server on localhost:5174
just build      # tsc && vite build
just android    # build, sync, install on a connected device
just ios        # build, sync, open Xcode
just devices    # list connected Android devices
```
