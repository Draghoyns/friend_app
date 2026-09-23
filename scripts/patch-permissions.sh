#!/usr/bin/env bash
# Adds the contacts permissions and the LAN-sync network settings to the native
# projects. Capacitor generates these files, so this runs after `npx cap add`.
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

# ── WiFi sync over plain HTTP ────────────────────────────────────────────────
# `Update over WiFi` fetches a new bundle from a laptop on the same network, so
# it speaks plain HTTP to a bare IP. Android has blocked cleartext by default
# since API 28 and iOS blocks it under ATS, so both need an opt-in. Nothing else
# in Orbit makes a network call.
NETWORK_CONFIG="$ROOT/frontend/android/app/src/main/res/xml/network_security_config.xml"

if [ -f "$MANIFEST" ]; then
  mkdir -p "$(dirname "$NETWORK_CONFIG")"
  cat > "$NETWORK_CONFIG" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Dev-only WiFi sync: plain HTTP to a laptop on the same LAN. -->
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>
XML
  if ! grep -q "usesCleartextTraffic" "$MANIFEST"; then
    /usr/bin/sed -i '' \
      's|android:theme="@style/AppTheme">|android:theme="@style/AppTheme"\n        android:usesCleartextTraffic="true"\n        android:networkSecurityConfig="@xml/network_security_config">|' \
      "$MANIFEST"
    echo "✔ Android: cleartext HTTP allowed (WiFi sync)"
  fi
fi

if [ -f "$PLIST" ] && ! grep -q "NSAllowsLocalNetworking" "$PLIST"; then
  /usr/bin/plutil -insert NSAppTransportSecurity \
    -xml '<dict><key>NSAllowsLocalNetworking</key><true/></dict>' "$PLIST" 2>/dev/null \
    || /usr/bin/plutil -replace NSAppTransportSecurity \
         -xml '<dict><key>NSAllowsLocalNetworking</key><true/></dict>' "$PLIST"
  /usr/bin/plutil -insert NSLocalNetworkUsageDescription \
    -string "Orbit looks for the computer it was built on, to update itself over WiFi." \
    "$PLIST" 2>/dev/null || true
  echo "✔ iOS: local networking allowed (WiFi sync)"
fi

if [ -f "$PLIST" ] && ! grep -q "NSContactsUsageDescription" "$PLIST"; then
  /usr/bin/plutil -insert NSContactsUsageDescription \
    -string "Orbit reads your contacts so you can import friends without typing their details." \
    "$PLIST"
  echo "✔ iOS: NSContactsUsageDescription added"
fi
