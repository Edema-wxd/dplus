#!/usr/bin/env bash
# Runs one Amrod sync, from cPanel cron:
#
#   0 21 * * * bash ~/dplus24/scripts/cron-amrod.sh daily   (server time, US Eastern)
#
# CRON_SECRET is read from the Node.js app's settings (cPanel "Setup Node.js
# App"), so it isn't copied into the crontab. --resolve sends the request
# straight to this server rather than out through Namecheap's CDN.
set -euo pipefail

JOB="${1:?usage: cron-amrod.sh daily|weekly}"
APP="${APP:-dplus24}"
SITE="${SITE:-www.de-signplus.com}"
SERVER_IP="${SERVER_IP:-162.0.229.137}"

SECRET=$(python3 -c '
import json, os, sys
cfg = json.load(open(os.path.expanduser("~/.cl.selector/node-selector.json")))
print(cfg[sys.argv[1]]["env_vars"]["CRON_SECRET"])
' "$APP")

echo "$(date -u +%FT%TZ) amrod-$JOB"
# The header goes through a file descriptor so the secret isn't in `ps` output.
curl -fsS --max-time 900 --resolve "$SITE:443:$SERVER_IP" \
  -H @<(printf 'Authorization: Bearer %s\n' "$SECRET") \
  "https://$SITE/api/cron/amrod-$JOB"
echo
