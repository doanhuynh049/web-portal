#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — start the Web Portal dev/prod server
#
# Usage:
#   ./start.sh          # dev server on default port 7854
#   PORT=9000 ./start.sh
#   ./start.sh --prod   # build then run production server
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-7854}"

# ── Kill processes by PID list (TERM → KILL) ─────────────────────────────────
kill_pids() {
  local pids="$1"
  local label="$2"
  [ -z "$pids" ] && return
  echo "⚠️  Stopping $label (PID: $pids)"
  echo "$pids" | xargs kill -TERM 2>/dev/null || true
  local deadline=$(( $(date +%s) + 3 ))
  while echo "$pids" | xargs kill -0 2>/dev/null && [ "$(date +%s)" -lt "$deadline" ]; do
    sleep 0.3
  done
  if echo "$pids" | xargs kill -0 2>/dev/null; then
    echo "   Still alive — sending SIGKILL..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
  echo "   ✓ Done"
}

# 1. Kill any next dev server for THIS project via .next/dev/lock
#    (Next.js writes {"pid":N,"port":M,...} here when it starts)
LOCK_FILE=".next/dev/lock"
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(python3 -c "import json; d=json.load(open('$LOCK_FILE')); print(d['pid'])" 2>/dev/null || true)
  LOCK_PORT=$(python3 -c "import json; d=json.load(open('$LOCK_FILE')); print(d.get('port',''))" 2>/dev/null || true)
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    kill_pids "$LOCK_PID" "Next.js dev server (lock: PID $LOCK_PID, port $LOCK_PORT)"
  fi
  rm -f "$LOCK_FILE"
fi

# 2. Kill any process still holding the target port
pids=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
if [ -n "$pids" ]; then
  kill_pids "$pids" "process on port $PORT"
fi

# 3. Brief settle time so the OS releases the socket
sleep 0.5

# ── Install dependencies if missing ─────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# ── Start server ─────────────────────────────────────────────────────────────
if [ "$1" = "--prod" ]; then
  echo "🔨 Building for production..."
  npm run build
  echo "🚀 Starting production server on http://localhost:$PORT"
  npx next start --port "$PORT"
else
  echo "🚀 Starting Web Portal dev server on http://localhost:$PORT"
  npx next dev --port "$PORT"
fi
