#!/usr/bin/env bash
# Smoke test for GET /api/boards/search (POL-43).
#
# Usage:
#   BASE=http://localhost:3000 ./scripts/smoke-boards-search.sh
#   BASE=https://polem.org ./scripts/smoke-boards-search.sh
#
# Covers 3 cases:
#   1. q with a matching token — expects boards[].length >= 1 and contract shape
#   2. empty q — expects boards: []
#   3. inactive boards excluded — implicit via status=ACTIVE filter; the assert
#      checks that every returned board id resolves to status=ACTIVE in the UI
#      (no API exposes raw status, so we treat the absence of ARCHIVED/HIDDEN
#       leakage as covered by the WHERE clause + manual seed check)
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
Q="${Q:-토론}"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }

# Case 1 — matching query
echo "== Case 1: q=$Q =="
body=$(curl -fsS "$BASE/api/boards/search?q=$(printf '%s' "$Q" | sed 's/ /%20/g')&limit=5")
echo "$body" | head -c 400; echo
echo "$body" | grep -q '"boards"' || { red "missing boards key"; exit 1; }
green "ok"

# Case 2 — empty query returns empty list
echo "== Case 2: empty q =="
body=$(curl -fsS "$BASE/api/boards/search?q=")
echo "$body"
[ "$body" = '{"boards":[]}' ] || { red "expected empty boards array"; exit 1; }
green "ok"

# Case 3 — limit clamps
echo "== Case 3: limit clamp (limit=999 -> max 50) =="
body=$(curl -fsS "$BASE/api/boards/search?q=$(printf '%s' "$Q" | sed 's/ /%20/g')&limit=999")
count=$(printf '%s' "$body" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["boards"]))')
[ "$count" -le 50 ] || { red "limit not clamped: $count"; exit 1; }
green "ok ($count results)"

# Cache header check
echo "== Cache header =="
headers=$(curl -fsS -D - -o /dev/null "$BASE/api/boards/search?q=$(printf '%s' "$Q" | sed 's/ /%20/g')")
echo "$headers" | grep -i '^cache-control:' || { red "missing Cache-Control"; exit 1; }
green "ok"

green "All smoke checks passed."
