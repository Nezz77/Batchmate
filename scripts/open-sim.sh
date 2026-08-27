#!/bin/bash
set -e

echo "🚀 Opening iOS Simulator..."
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer open -a Simulator

# Wait for booted simulator
echo "⏳ Checking simulator status..."
sleep 2

# Find booted device
BOOTED_ID=$(DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun simctl list devices | grep "Booted" | head -n 1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

if [ -z "$BOOTED_ID" ]; then
  echo "📱 Booting default iPhone simulator (iPhone 17)..."
  DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun simctl boot "iPhone 17" || true
  BOOTED_ID=$(DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun simctl list devices | grep "Booted" | head -n 1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
fi

echo "✅ Simulator ready: $BOOTED_ID"

# Get local IP for simulator network access
LOCAL_IP="localhost"
TARGET_URL="http://${LOCAL_IP}:5252"

echo "🌐 Launching Mobile Safari in iOS Simulator to $TARGET_URL"
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun simctl openurl booted "$TARGET_URL"

echo "✨ Simulator test URL opened! Starting mobile dev server..."
VITE_TARGET=mobile npx vite --host --port 5252
