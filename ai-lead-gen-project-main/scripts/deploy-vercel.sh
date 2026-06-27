#!/usr/bin/env bash
# Push env vars from .env to Vercel Production and deploy.
# Usage: VERCEL_TOKEN=xxx ./scripts/deploy-vercel.sh
set -euo pipefail
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN (a freshly rotated token)}"
[ -f .env ] || { echo ".env not found — copy from .env.production.example"; exit 1; }

echo "==> Linking project"
vercel link --yes --token "$VERCEL_TOKEN"

echo "==> Syncing env vars to Production"
while IFS= read -r line; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$line" ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  val="${val%\"}"; val="${val#\"}"   # strip surrounding quotes
  [[ -z "$key" ]] && continue
  # remove then add so reruns are idempotent
  vercel env rm "$key" production --yes --token "$VERCEL_TOKEN" >/dev/null 2>&1 || true
  printf '%s' "$val" | vercel env add "$key" production --token "$VERCEL_TOKEN" >/dev/null
  echo "   set $key"
done < .env

echo "==> Deploying to production"
vercel --prod --token "$VERCEL_TOKEN"
echo "==> Done. Verify at your Production URL."
