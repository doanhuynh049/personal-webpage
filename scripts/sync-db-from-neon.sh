#!/usr/bin/env bash
# Copy schema + data from Neon (psql/pg_dump) → local Docker Postgres.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log()  { echo "[sync-db] $*"; }
warn() { echo "[sync-db] WARNING: $*" >&2; }

LOCAL_URL="${LOCAL_RUNTIME_URL:-postgresql://personal:personal@localhost:5434/personal_web}"

if [[ ! -f .env ]]; then
  warn ".env not found"
  exit 1
fi

REMOTE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"
REMOTE_URL="${REMOTE_URL//[?&]uselibpqcompat=true/}"
REMOTE_URL="${REMOTE_URL//uselibpqcompat=true&/}"
REMOTE_URL="${REMOTE_URL%\?}"

if [[ -z "$REMOTE_URL" ]] || [[ ! "$REMOTE_URL" == *neon.tech* ]]; then
  warn "DATABASE_URL is not Neon — nothing to sync."
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  warn "Docker not found."
  exit 1
fi

if ! docker compose exec -T db pg_isready -U personal -d personal_web >/dev/null 2>&1; then
  warn "Local Docker Postgres not ready."
  exit 1
fi

log "Syncing Neon → local Docker (pg_dump)..."

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

run_pg_dump() {
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$REMOTE_URL" --no-owner --no-acl --clean --if-exists -f "$TMP" 2>/dev/null && return 0
  fi
  return 1
}

run_docker_pg_dump() {
  # Neon is PG 18 — host pg_dump 10.x and postgres:17 images fail version check.
  for image in postgres:18-alpine postgres:18; do
    if docker run --rm "$image" pg_dump "$REMOTE_URL" \
      --no-owner --no-acl --clean --if-exists > "$TMP" 2>/dev/null \
      && [[ -s "$TMP" ]]; then
      return 0
    fi
  done
  return 1
}

if ! run_pg_dump; then
  if ! run_docker_pg_dump; then
    warn "pg_dump from Neon failed — use psql 18+ or Docker postgres:18. Local seed will be used."
    exit 1
  fi
  log "Used Docker postgres:18 for pg_dump."
fi

if ! docker compose exec -T db psql -U personal -d personal_web -v ON_ERROR_STOP=0 -q < "$TMP" >/dev/null 2>&1; then
  warn "psql restore failed — app will init schema on startup."
  exit 1
fi

log "Neon snapshot restored to local Postgres."
