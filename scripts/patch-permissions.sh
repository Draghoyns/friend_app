#!/usr/bin/env bash
# Adds the contacts permission to the native projects.
# Capacitor generates these files, so this runs after `npx cap add`.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/frontend/android/app/src/main/AndroidManifest.xml"
PLIST="$ROOT/frontend/ios/App/App/Info.plist"

if [ -f "$MANIFEST" ] && ! grep -q "READ_CONTACTS" "$MANIFEST"; then
  /usr/bin/sed -i '' \
    's|<application|<uses-permission android:name="android.permission.READ_CONTACTS" />\n\n    <application|' \
    "$MANIFEST"
  echo "✔ Android: READ_CONTACTS added"
fi

if [ -f "$PLIST" ] && ! grep -q "NSContactsUsageDescription" "$PLIST"; then
  /usr/bin/plutil -insert NSContactsUsageDescription \
    -string "Orbit reads your contacts so you can import friends without typing their details." \
    "$PLIST"
  echo "✔ iOS: NSContactsUsageDescription added"
fi
