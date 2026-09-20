# Orbit

> **Phone-first app.** Designed primarily for iOS and Android via Capacitor. The web build works but the phone experience is the priority.

An app that remembers the last time you saw each friend and tells you **who to see next**.

Every friend has a **friendship level** that sets how often you want to see them — an inner-circle
friend once a month, an acquaintance once a year. Orbit divides the days since you last met by
that target and ranks everyone by how far behind they are, so a close friend you saw last month
outranks an acquaintance you last saw in spring.

- All data lives **on the device** — no account, no server, no network calls
- Nothing ever leaves the app: no dialler, no mail client, no phone numbers stored
- Import friends from your phone's **contacts** (searchable), or add them by hand

---

## Features

### Who next
- The single most overdue friend, big and front-and-centre, with **I saw them**, **I called**, **I texted** and **Not now**
- The next eight below, ranked the same way
- **I'm socially tired** — one tap snoozes everyone currently overdue for a week
- Tells you plainly when nobody is overdue

### Friend detail
- Tap anyone to open their sheet: name, friendship level, circles
- **At a glance** — last seen · time left (or overdue by) · total meetups, over a progress bar
- **Who reaches out** — a bar showing how the initiative splits between you two
- **Actions** — I saw them · I called · I texted · Snooze · Pause · Edit
- **I called** and **I texted** log a meetup dated today in one tap, tagged as such. They open nothing outside Orbit — a second tap on the same day is ignored rather than logged twice
- **Entry log** — every meetup concerning that friend, with date, kind, place, note, who was also there, and who made it happen (tap the badge to set or change it)

### Friends
- **Friendship levels** — Inner circle (1 month) · Close friend (2 months) · Good friend (4 months) · Friendly (8 months) · Acquaintance (1 year)
- **Custom rhythm** — override the level for one person ("see Marc every 45 days")
- **Progress bar** — how far through their interval each friend is, in their level's color. Full means it's time. No labels, no grading people
- **Circles** — free-form tags (work, climbing, school) on top of the levels; filter by several at once
- **Search** by name or notes; press `/` to focus
- **Filter** by friendship level and circle; sort by most overdue, A → Z, or seen recently
- **Snooze** — 3 days, a week, 2 weeks, a month, 3 months, or until a date you pick; **pause** a friend indefinitely without deleting them
- **Notes** per friend — kids' names, what they're into, what to ask about next time

### Levels
- The whole ladder on one screen — **rename**, **recolor** and **re-time** every friendship level
- Set the rhythm by typing a number of days, or tap a preset: 1 week · 2 weeks · 1 month · 2 months · 3 months · 6 months · 1 year
- Levels stay sorted by how often they ask for a meetup, and each shows how many friends sit on it
- **Add your own** level, or delete a custom one (its friends move to another level)
- **Custom rhythms** — every friend who overrides their level, listed in one place: retune them, or reset them back onto the level

### Meetups
- A **+** button sits in the bottom-right corner of every tab — logging a meetup is never more than one tap away
- Log a meetup with a **date**, an optional **place** and a **note**
- **Kind of hangout** — free-form tags on the meetup itself: dinner, coffee, a walk, a call. Reusable across meetups, and filterable in the Timeline
- **Several friends at once** — pick everyone who was there and log the occasion once, whatever time of day it was; everyone present gets it, and editing or deleting it applies to all of them
- **Who reached out** — mark each meetup as yours, theirs or mutual
- Logging resets the clock for everyone present, and clears any snooze

### Timeline
- Every meetup you ever logged, newest first, grouped by month
- Filter by **kind of hangout**
- A meetup with several friends appears once, with stacked avatars and everyone's name

### Stats
- Period picker — **Month**, **Quarter**, **Year**
- Friends in orbit · meetups logged · **on-track percentage**
- **Furthest behind** — the five friends most past their interval, with progress bars
- **By kind of hangout** — what your time together actually looks like
- **Who reaches out** — your overall initiative split, and the friends where you do 75%+ of it
- On-track count per friendship level and per circle
- Who you saw the most in the period

### Import from contacts
- **Phone build only** — reads the address book and gives you a **searchable list**; contacts already in Orbit are marked. The browser build has no import, only manual entry
- Picking a contact prefills the new-friend form with the name. Numbers and addresses are shown in the picker to tell two people apart, but Orbit does not keep them

### Sidebar
- **Friendship levels** — the current ladder at a glance, with a shortcut into the Levels tab to edit it
- **Circles** — create, rename, recolor and delete them
- **Kinds of hangout** — the same, for what a meetup was
- **Weekly nudge** — a local notification on a chosen weekday and time, listing who is overdue
- **Appearance** — dark / light theme, six accent presets plus a color wheel
- **Data** — export the whole orbit as JSON, import it back; show/hide paused friends

---

## How it works

| Layer | Tech | What it does |
|---|---|---|
| Frontend | React + TypeScript + Vite | The whole app — runs in a browser during dev, compiled to static files for mobile |
| Native wrapper | Capacitor | Wraps the compiled site into an Android/iOS app and provides contacts + notifications |

There is no backend. State lives in the device's local storage via Zustand `persist`, and the app
makes no network calls.

### The ranking

```
urgency = days since last meetup / target interval for that friend
```

`1.0` means exactly on schedule, above `1.0` means overdue. The Who-next tab sorts by that number.
A friend you have never seen counts from the day you added them, so new entries surface gradually
instead of exploding to the top.

---

## What you need

- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) (Android) **or** Xcode (iOS) — only for the phone build

---

## Step 1 — Run it on your Mac

```bash
chmod +x start.sh
./start.sh
```

Opens the app at **http://localhost:5174**. Data is stored in that browser's local storage and is
separate from the phone's data.

---

## Step 2 — Install Android Studio and the SDK

**2a. Download and install [Android Studio](https://developer.android.com/studio)**

> **Java:** Android Studio ships with its own JDK — do not install a separate one. `just android`
> points Gradle at it deliberately, because the Java on a Mac's PATH is often 8, and the Android
> Gradle Plugin needs 17+. If you ever see `No matching variant ... compatible with Java 8`, that
> is what happened.

**2b. Download the Android SDK**

Android Studio is just the IDE — the SDK (the actual build tools) must be downloaded separately inside it:

1. Open Android Studio — you'll land on a welcome screen
2. Click **More Actions → SDK Manager**
   > If a project opens instead of the welcome screen: top menu → **Android Studio → Settings → Languages & Frameworks → Android SDK**
3. In the **SDK Platforms** tab: check **Android 14 (API 34)** (or the latest available)
4. In the **SDK Tools** tab: make sure these are checked:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools (latest)
   - Android SDK Platform-Tools *(this includes `adb`, needed to talk to your phone)*
5. Click **Apply** and wait for the download to finish

**2c. Add the SDK to your shell**

```bash
cat >> ~/.zshrc << 'EOF'

# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
EOF

source ~/.zshrc
```

Open a **new terminal window** after running this, or the next steps won't find `adb`.

---

## Step 3 — Create the native projects

The `android/` and `ios/` folders are generated, not committed. Create them once:

```bash
just add-platforms
```

That runs `npx cap add android` / `npx cap add ios`, patches in the contacts permission
(`READ_CONTACTS` on Android, `NSContactsUsageDescription` on iOS) — without it the contacts import
silently returns nothing — and regenerates the icons.

### Icons

`android/` and `ios/` are generated, so the icons cannot live there. The two source drawings sit in
`frontend/assets/source/`, and `just icons` rebuilds everything from them:

| Output | What it is |
|---|---|
| `assets/icon.png` | 1024² on white, no transparency — iOS rejects an icon with an alpha channel |
| `assets/icon-foreground.png` · `icon-background.png` | The Android adaptive pair. The white paper becomes the background layer and the artwork is keyed off it, so launcher masks crop white rather than clipping the drawing |
| `assets/notification.png` | White silhouette on transparency. Android throws away a small icon's colours and redraws its alpha in `iconColor`, so anything full-colour arrives as a white blob |
| `public/favicon.png` · `apple-touch-icon.png` | The browser build |

To change the icon, replace the JPEGs in `frontend/assets/source/` and run `just icons`.

---

## Step 4 — Prepare your Android phone

**Enable Developer Options:**
1. Settings → About phone → tap **Build number** 7 times
2. You'll see "You are now a developer!"

**Enable USB Debugging:**
- Settings → Developer options → turn on **USB debugging**

**Enable Install via USB** *(required on Xiaomi/MIUI and some other brands)*:
- Settings → Developer options → turn on **Install via USB**

Connect your phone to your Mac via USB, then check it's visible:

```bash
just devices
```

You should see your device listed as `device`. If it shows `unauthorized`, check your phone for the
USB debugging approval popup and tap Allow.

---

## Step 5 — Install on your phone

```bash
just android
```

This builds the web assets, syncs them into the Android project, compiles the APK and installs it.

> If it fails with `ERR_SDK_NOT_FOUND`, your terminal doesn't have `ANDROID_HOME` set — open a new
> terminal window and try again (the shell setup in Step 2c only takes effect in new windows).

> If the APK builds but the install is refused with `INSTALL_FAILED_USER_RESTRICTED`, the phone is
> blocking it: turn on **Install via USB** in Developer options (Step 4) and run it again.

To check the build alone, without a phone plugged in, run `just apk`.

---

## iOS

```bash
# One-time setup
cd frontend/ios/App && pod install

# Build, sync and open in Xcode
just ios
```

In Xcode:
1. Select your phone from the device picker at the top
2. Go to **Signing & Capabilities** → set your Apple ID as the Team (free account is fine)
3. Press ▶ **Run**

---

## Using the app

- Open the app on your phone — it works offline, no Wi-Fi or Mac needed
- Add friends: **Who next → From contacts / By hand**, or the `+` in the header
- Every time you see someone, hit **I saw them**
- Back up from the sidebar → **Export** (a JSON file you can re-import anywhere)

---

## Just recipes

[`just`](https://github.com/casey/just) is a command runner (`brew install just`). All common tasks
are defined in the `justfile` at the repo root — run `just <recipe>` from anywhere in the project.

| Recipe | What it does |
|--------|-------------|
| `just dev` | Install deps and start the dev server at `localhost:5174` |
| `just install` | Install frontend npm dependencies |
| `just build` | Build the frontend into `frontend/dist` |
| `just apk` | Build the debug APK — same as `just android` without the install, no device needed |
| `just preview` | Serve the production build locally |
| `just add-platforms` | Create the Android/iOS projects and patch in the contacts permission |
| `just cap-sync` | Sync compiled assets into the native projects |
| `just icons` | Rebuild every app and notification icon from `frontend/assets/source` |
| `just android` | Full Android deploy: build → sync → assemble APK → install via ADB |
| `just ios` | Build, sync and open the iOS project in Xcode |
| `just devices` | List connected Android devices |

---

## Todo / Ideas

### Suggestions
- [ ] "Who can I see tonight?" — filter suggestions by who lives nearby
- [x] Group meetups — log one evening against several friends at once
- [x] Reciprocity — track who reached out first, flag friendships you always initiate

### Friends
- [x] A "socially tired" escape hatch — snooze everyone overdue at once
- [ ] Birthdays, with their own reminder independent of the meetup rhythm
- [ ] Seasonal rhythms — someone you only see in summer shouldn't nag you in January
- [x] Circles / tags (work, climbing, school) on top of friendship levels
- [x] Snooze durations — 3 days to 3 months, or a specific date

### Data
- [ ] Two-way contact sync — keep names fresh when the address book changes
- [ ] Calendar import — infer meetups from events you both attended
- [ ] iCloud / Google Drive backup (native Capacitor plugin)

---

## Stack

| Layer    | Tech                                        |
|----------|---------------------------------------------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| State    | Zustand (`persist` → device local storage)  |
| Mobile   | Capacitor 6 (iOS + Android)                 |
| Native   | @capacitor-community/contacts · @capacitor/local-notifications |
