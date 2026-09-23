#!/usr/bin/env bash
# Adds the contacts permissions to the native projects.
# Capacitor generates these files, so this runs after `npx cap add`.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/frontend/android/app/src/main/AndroidManifest.xml"
PLIST="$ROOT/frontend/ios/App/App/Info.plist"

# Orbit only ever reads the address book, but @capacitor-community/contacts binds
# READ_CONTACTS and WRITE_CONTACTS to a single "contacts" permission alias. If one
# of the two is missing from the manifest, Capacitor rejects every call to the
# plugin with "Missing the following permissions in AndroidManifest.xml" — even
# after the user grants the prompt — so both have to be declared.
add_permission() {
  local perm="$1"
  if ! grep -q "android.permission.$perm" "$MANIFEST"; then
    /usr/bin/sed -i '' \
      "s|<application|<uses-permission android:name=\"android.permission.$perm\" />\n\n    <application|" \
      "$MANIFEST"
    echo "✔ Android: $perm added"
  fi
}

if [ -f "$MANIFEST" ]; then
  add_permission READ_CONTACTS
  add_permission WRITE_CONTACTS
fi

if [ -f "$PLIST" ] && ! grep -q "NSContactsUsageDescription" "$PLIST"; then
  /usr/bin/plutil -insert NSContactsUsageDescription \
    -string "Orbit reads your contacts so you can import friends without typing their details." \
    "$PLIST"
  echo "✔ iOS: NSContactsUsageDescription added"
fi
