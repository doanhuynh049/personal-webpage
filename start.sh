#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create .env from template on first run
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo "Edit .env before running in production."
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

mkdir -p public/uploads data

PORT="${PORT:-8637}"
export PORT

# Read USE_SQLITE from .env without sourcing (special chars in passwords break bash)
USE_SQLITE="$(grep -E '^USE_SQLITE=' .env 2>/dev/null | cut -d= -f2- | tr -d ' "' || true)"
HAS_DB_URL="$(grep -E '^DATABASE_URL=.+' .env 2>/dev/null || true)"

if [ "$USE_SQLITE" = "1" ] || [ "$USE_SQLITE" = "true" ]; then
  echo "Mode: Local SQLite (data/site.db)"
elif [ -n "$HAS_DB_URL" ]; then
  echo "Mode: Neon PostgreSQL"
else
  echo "WARNING: No DATABASE_URL found. Add Neon URL to .env or set USE_SQLITE=1"
fi

echo "----------------------------------------"
echo " Personal Webpage"
echo " Site:  http://localhost:${PORT}"
echo " Admin: http://localhost:${PORT}/admin"
echo "----------------------------------------"

if [ "$USE_SQLITE" = "1" ] || [ "$USE_SQLITE" = "true" ]; then
  exec node --experimental-sqlite server.js
else
  exec node server.js
fi
