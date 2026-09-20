# Orbit

> **Phone-first app.** Designed primarily for iOS and Android via Capacitor. The web build works but the phone experience is the priority.

An app that remembers the last time you saw each friend and tells you **who to see next**.

Every friend has a **friendship level** that sets how often you want to see them — an inner-circle
friend every two weeks, an acquaintance once a year. Orbit divides the days since you last met by
that target and ranks everyone by how far behind they are, so a close friend you saw last month
outranks an acquaintance you last saw in spring.

- All data lives **on the device** — no account, no server, no network calls
- Import friends from your phone's **contacts** (searchable), or add them by hand

---

## Features

### Who next
- The single most overdue friend, big and front-and-centre, with **I saw them**, **Call** and **Not now**
- The next eight below, ranked the same way
- Tells you plainly when nobody is overdue

### Friends
- **Friendship levels** — Inner circle (2 weeks) · Close friend (1 month) · Good friend (2.5 months) · Friendly (5 months) · Acquaintance (1 year)
- **Custom rhythm** — override the level for one person ("see Marc every 45 days")
- **Freshness** — each friend is Fresh · Soon · Due · Overdue, with a progress bar toward their next meetup
- **Search** by name or notes; press `/` to focus
- **Filter** by friendship level; sort by most overdue, A → Z, or seen recently
- **Snooze** a friend for two weeks, or **pause** them indefinitely without deleting them
- **Notes** per friend — kids' names, what they're into, what to ask about next time

### Meetups
- Log a meetup with a **date**, an optional **place** and a **note**
- Logging one resets that friend's clock and clears any snooze
- Full **history** per friend, deletable entry by entry

### Timeline
- Every meetup you ever logged, newest first, grouped by month

### Stats
- Period picker — **Month**, **Quarter**, **Year**
- Friends in orbit · meetups logged · **on-track percentage**
- Breakdown of who needs you (Fresh / Soon / Due / Overdue)
- On-track count per friendship level
- Who you saw the most in the period

### Import from contacts
- On the phone: reads the address book and gives you a **searchable list**; contacts already in Orbit are marked
- In a browser: uses the Contact Picker API where available, otherwise points you to manual entry
- Picking a contact prefills the new-friend form with name, phone, email and photo

### Sidebar
- **Friendship levels** — rename, re-time and recolor them; add your own; delete a custom one (its friends move to another level)
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

> **Java:** Android Studio ships with its own JDK — do not install a separate one. An older system Java will break the Gradle build.

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

That runs `npx cap add android` / `npx cap add ios` and then patches in the contacts permission
(`READ_CONTACTS` on Android, `NSContactsUsageDescription` on iOS) — without it the contacts import
silently returns nothing.

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
| `just preview` | Serve the production build locally |
| `just add-platforms` | Create the Android/iOS projects and patch in the contacts permission |
| `just cap-sync` | Sync compiled assets into the native projects |
| `just android` | Full Android deploy: build → sync → assemble APK → install via ADB |
| `just ios` | Build, sync and open the iOS project in Xcode |
| `just devices` | List connected Android devices |

---

## Todo / Ideas

### Suggestions
- [ ] Group hangouts — log one meetup against several friends at once
- [ ] "Who can I see tonight?" — filter suggestions by who lives nearby
- [ ] Reciprocity — track who reached out first, flag friendships you always initiate

### Friends
- [ ] Birthdays, with their own reminder independent of the meetup rhythm
- [ ] Circles / tags (work, climbing, school) on top of friendship levels
- [ ] Seasonal rhythms — someone you only see in summer shouldn't nag you in January

### Data
- [ ] Two-way contact sync — keep names and photos fresh when the address book changes
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
