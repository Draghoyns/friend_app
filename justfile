# Orbit — task runner
# Install just: brew install just

# Android Gradle Plugin 8 needs a JDK 17+. macOS often has only Java 8 on PATH,
# which fails with "No matching variant ... compatible with Java 8" before the
# build starts. Android Studio bundles a suitable JDK, so prefer that one.
studio_jdk := "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
android_sdk := env_var_or_default("ANDROID_HOME", env_var("HOME") / "Library/Android/sdk")

# Start the dev server at http://localhost:5174
dev:
    ./start.sh

# Install frontend dependencies
install:
    cd frontend && npm install

# Build the frontend into frontend/dist
build:
    cd frontend && npm run build

# Serve the production build locally
preview:
    cd frontend && npm run preview

# Create the native projects (run once, before `just android` / `just ios`)
add-platforms:
    cd frontend && npx cap add android || true
    cd frontend && npx cap add ios || true
    ./scripts/patch-permissions.sh
    just icons

# Rebuild every app and notification icon from frontend/assets/source
icons:
    # The native projects are generated and gitignored, so the icons are rebuilt
    # from source after `npx cap add` rather than being committed.
    node scripts/make-icon-sources.mjs
    cd frontend && npx capacitor-assets generate --android --ios
    node scripts/install-notification-icon.mjs

# Sync compiled assets into the native projects (after a build)
cap-sync:
    cd frontend && npx cap sync

# Print the JDK Gradle will use, or explain what is missing
_jdk:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -x "{{studio_jdk}}/bin/java" ]; then
        echo "{{studio_jdk}}"
    elif [ -n "${JAVA_HOME:-}" ] && [ -x "${JAVA_HOME}/bin/java" ]; then
        echo "${JAVA_HOME}"
    else
        echo "No JDK found for Gradle." >&2
        echo "Install Android Studio (it bundles one), or set JAVA_HOME to a JDK 17+." >&2
        exit 1
    fi

# Build the debug APK (no device needed)
apk:
    #!/usr/bin/env bash
    set -euo pipefail
    export JAVA_HOME="$(just _jdk)"
    export ANDROID_HOME="{{android_sdk}}"
    cd frontend && npm run build && npx cap sync android
    cd android && ./gradlew assembleDebug

# Build and install on a connected Android device via USB
android: apk
    #!/usr/bin/env bash
    set -euo pipefail
    adb="{{android_sdk}}/platform-tools/adb"
    apk=frontend/android/app/build/outputs/apk/debug/app-debug.apk
    out=$("$adb" install -r "$apk" 2>&1) || true
    echo "$out"
    case "$out" in
        *INSTALL_FAILED_USER_RESTRICTED*)
            echo
            echo "The phone refused the install. On Xiaomi/MIUI and some other brands:" >&2
            echo "  Settings -> Developer options -> turn on 'Install via USB'" >&2
            echo "(and keep 'USB debugging' on). Then re-run 'just android'." >&2
            exit 1 ;;
        *Success*) echo "Installed." ;;
        *) exit 1 ;;
    esac

# Open the iOS project in Xcode
ios:
    cd frontend && npm run build && npx cap sync ios
    cd frontend && npx cap open ios

# List connected Android devices
devices:
    "{{android_sdk}}/platform-tools/adb" devices
