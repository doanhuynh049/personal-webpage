#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env if present
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Create .env from template on first run
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo "Edit .env to set ADMIN_PASSWORD and SESSION_SECRET before production use."
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Ensure required directories exist
mkdir -p data public/uploads

PORT="${PORT:-8637}"
export PORT

echo "----------------------------------------"
echo " Personal Webpage"
echo "----------------------------------------"
echo " Site:  http://localhost:${PORT}"
echo " Admin: http://localhost:${PORT}/admin"
echo " Password: ${ADMIN_PASSWORD:-admin123}"
echo "----------------------------------------"

exec node --experimental-sqlite server.js
