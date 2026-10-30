#!/usr/bin/env bash
# Builds locally and ships the app to the shared server.
#
#   npm run remotedeploy
#
# The build reads .env.local, and NEXT_PUBLIC_* values are baked into the
# client bundle, so make sure NEXT_PUBLIC_SITE_URL there is the live domain.
# Server-only variables (DATABASE_URL etc.) come from the cPanel Node.js app
# settings at runtime, not from this build.
#
# Override any of these in the environment if the server details change.
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-162.0.229.137}"
DEPLOY_PORT="${DEPLOY_PORT:-21098}"
DEPLOY_USER="${DEPLOY_USER:-desimrwr}"
DEPLOY_DIR="${DEPLOY_DIR:-dplus}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/id_ed25519}"
# cPanel's "Setup Node.js App" page shows this command ("Enter to the virtual
# environment"); npm on the server has to run inside it.
DEPLOY_NODEENV="${DEPLOY_NODEENV:-}"

SSH=(ssh -p "$DEPLOY_PORT" -i "$DEPLOY_KEY" "$DEPLOY_USER@$DEPLOY_HOST")

npx next build

rm -f deploy.zip
# .next/cache is build-time only; public/brochures holds source files for
# scripts/brochure-import.ts, which are served from UploadThing instead.
zip -qr deploy.zip .next public package.json package-lock.json server.js \
  next.config.js next.config.ts \
  -x '.next/cache/*' 'public/brochures/*'

scp -P "$DEPLOY_PORT" -i "$DEPLOY_KEY" deploy.zip \
  "$DEPLOY_USER@$DEPLOY_HOST:~/$DEPLOY_DIR/"

if [[ -z "$DEPLOY_NODEENV" ]]; then
  echo
  echo "Uploaded. DEPLOY_NODEENV is not set, so finish on the server:"
  echo "  cd ~/$DEPLOY_DIR && rm -rf .next && unzip -qo deploy.zip"
  echo "  <enter the Node.js virtual environment> && npm ci --omit=dev"
  echo "  mkdir -p tmp && touch tmp/restart.txt"
  exit 0
fi

"${SSH[@]}" "set -e
  cd ~/$DEPLOY_DIR
  rm -rf .next && unzip -qo deploy.zip && rm deploy.zip
  $DEPLOY_NODEENV
  npm ci --omit=dev --no-audit --no-fund
  mkdir -p tmp && touch tmp/restart.txt"

echo "Deployed and restarted."
