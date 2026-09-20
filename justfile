# Orbit — task runner
# Install just: brew install just

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

# Sync compiled assets into the native projects (after a build)
cap-sync:
    cd frontend && npx cap sync

# Build and install on a connected Android device via USB
android:
    cd frontend && npm run build && npx cap sync android
    cd frontend/android && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew assembleDebug
    "$HOME/Library/Android/sdk/platform-tools/adb" install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk

# Open the iOS project in Xcode
ios:
    cd frontend && npm run build && npx cap sync ios
    cd frontend && npx cap open ios

# List connected Android devices
devices:
    "$HOME/Library/Android/sdk/platform-tools/adb" devices
