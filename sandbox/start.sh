#!/bin/bash
set -e

DAML=~/.daml/bin/daml
DAR=".daml/dist/nexus-example-0.0.1.dar"

# Kill any lingering sandbox on startup
pkill -f "daml sandbox" 2>/dev/null || true
pkill -f "CantonCommunityApp" 2>/dev/null || true
sleep 1

# Build if DAR doesn't exist
if [ ! -f "$DAR" ]; then
  echo "Building DAML..."
  $DAML build
fi

# Start sandbox (suppress interleaved output by redirecting to log file)
SANDBOX_LOG="/tmp/canton-sandbox.log"
echo "Starting Canton sandbox..."
JAVA_TOOL_OPTIONS="-Duser.language=en -Duser.country=US" \
  $DAML sandbox --json-api-port 7575 > "$SANDBOX_LOG" 2>&1 &
SANDBOX_PID=$!

# Tail the log in background so user can see progress
tail -f "$SANDBOX_LOG" &
TAIL_PID=$!

# Wait for ledger API (port 6865) to be ready
echo "Waiting for port 6865..."
for i in $(seq 1 60); do
  if nc -z localhost 6865 2>/dev/null; then
    break
  fi
  if ! kill -0 $SANDBOX_PID 2>/dev/null; then
    kill $TAIL_PID 2>/dev/null
    echo "Sandbox crashed. Check $SANDBOX_LOG"
    exit 1
  fi
  sleep 1
done

# Upload DAR (suppress warnings, show only result)
echo "Uploading $DAR..."
$DAML ledger upload-dar --host localhost --port 6865 "$DAR" 2>&1 \
  | grep -v "WARNING\|deprecated\|DPM\|dpm.html\|removed in\|disable" || true

echo "Canton sandbox ready (PID: $SANDBOX_PID)"

# Keep sandbox in foreground
wait $SANDBOX_PID
kill $TAIL_PID 2>/dev/null
