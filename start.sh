#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log()  { echo "[start.sh] $*"; }
warn() { echo "[start.sh] WARNING: $*" >&2; }

LOCAL_RUNTIME_URL='postgresql://personal:personal@localhost:5434/personal_web'

if [ ! -f .env ]; then
  cp .env.example .env
  log "Created .env from .env.example — set DATABASE_URL before production use."
fi

if [ ! -d node_modules ]; then
  log "Installing dependencies..."
  npm install
fi

mkdir -p public/uploads

# shellcheck disable=SC1091
set -a
source .env 2>/dev/null || true
set +a

PORT="${PORT:-8637}"
export PORT

if ! grep -qE '^DATABASE_URL=.+' .env 2>/dev/null; then
  echo "ERROR: DATABASE_URL is required in .env"
  exit 1
fi

start_local_db() {
  if ! command -v docker >/dev/null 2>&1; then
    warn "Docker not found — cannot use local Postgres fallback."
    return 1
  fi
  log "Starting local Postgres (Docker, port 5434)..."
  docker compose up -d db
  for i in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U personal -d personal_web >/dev/null 2>&1; then
      for j in $(seq 1 15); do
        if RUNTIME_DATABASE_URL="$LOCAL_RUNTIME_URL" node -e "
          const { Pool } = require('pg');
          const p = new Pool({ connectionString: process.env.RUNTIME_DATABASE_URL });
          p.query('SELECT 1').then(() => p.end()).then(() => process.exit(0)).catch(() => process.exit(1));
        " >/dev/null 2>&1; then
          log "Local database is ready."
          return 0
        fi
        sleep 1
      done
      warn "Local Postgres accepts pg_isready but Node connections still failing."
      return 1
    fi
    sleep 1
  done
  warn "Local database may not be ready yet."
  return 1
}

use_local_runtime() {
  export RUNTIME_DATABASE_URL="$LOCAL_RUNTIME_URL"
  export DB_DRIVER=pg
  if [[ -f scripts/sync-db-from-neon.sh ]]; then
    chmod +x scripts/sync-db-from-neon.sh 2>/dev/null || true
    LOCAL_RUNTIME_URL="$LOCAL_RUNTIME_URL" bash scripts/sync-db-from-neon.sh \
      || warn "Neon→local sync skipped (fresh seed on first request)."
  fi
}

probe_neon_node() {
  node scripts/probe-neon.js >/dev/null 2>&1
}

choose_runtime_db() {
  if [[ "${USE_LOCAL_DB:-}" == "1" ]]; then
    log "USE_LOCAL_DB=1 — local Docker Postgres for runtime."
    start_local_db || exit 1
    use_local_runtime
    return
  fi

  if [[ -n "${RUNTIME_DATABASE_URL:-}" ]]; then
    log "RUNTIME_DATABASE_URL set — using override for Node runtime."
    export DB_DRIVER="${DB_DRIVER:-pg}"
    return
  fi

  if probe_neon_node; then
    log "Neon reachable from Node (DB_DRIVER=${DB_DRIVER:-http})."
    unset RUNTIME_DATABASE_URL
    return
  fi

  warn "Node cannot reach Neon (HTTP/TCP ETIMEDOUT). psql may still work."
  if start_local_db; then
    warn "Falling back to local Docker Postgres for this session."
    use_local_runtime
    return
  fi

  echo "Failed to start: Could not connect to Neon from Node and local Docker is unavailable."
  echo "  Run: USE_LOCAL_DB=1 ./start.sh"
  echo "  Or:  docker compose up -d db && add to .env:"
  echo "       RUNTIME_DATABASE_URL=$LOCAL_RUNTIME_URL"
  echo "       DB_DRIVER=pg"
  exit 1
}

choose_runtime_db

free_port_if_stale() {
  local pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -ti :"${PORT}" 2>/dev/null | head -1 || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pid="$(fuser "${PORT}"/tcp 2>/dev/null | tr -d ' ' || true)"
  fi
  if [[ -z "$pid" ]]; then
    return 0
  fi
  local cmd
  cmd="$(ps -p "$pid" -o comm= 2>/dev/null || true)"
  if [[ "$cmd" == *node* ]]; then
    warn "Port ${PORT} in use by node (PID ${pid}) — stopping previous server."
    kill "$pid" 2>/dev/null || true
    sleep 1
    return 0
  fi
  echo "ERROR: Port ${PORT} already in use (PID ${pid}, ${cmd})."
  echo "  Stop it manually, or run: PORT=$((PORT + 1)) ./start.sh"
  exit 1
}

free_port_if_stale

echo "----------------------------------------"
echo " Personal Webpage"
echo " Site:  http://localhost:${PORT}"
echo " Admin: http://localhost:${PORT}/admin"
if [[ -n "${RUNTIME_DATABASE_URL:-}" ]]; then
  echo " DB:    local Docker (port 5434)"
else
  echo " DB:    Neon (DB_DRIVER=${DB_DRIVER:-http})"
fi
echo "----------------------------------------"

export RUNTIME_DATABASE_URL="${RUNTIME_DATABASE_URL:-}"
export DB_DRIVER="${DB_DRIVER:-}"

exec node server.js
