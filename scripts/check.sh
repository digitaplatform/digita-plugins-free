#!/usr/bin/env bash
# Every check this repository has to pass, in order, before a push: the pre-push hook runs this file.
# It stops at the first red step and names it. The steps are the two that .github/workflows/ci.yml runs after a push lands on master.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

fail() {
  echo "check: FAIL — $1"
  exit 1
}

command -v pnpm >/dev/null 2>&1 || fail "pnpm is not on this machine (PATH)"
[ -d node_modules ] || fail "node_modules is missing; run pnpm install --frozen-lockfile first"

echo "check: 1/2 pnpm -r build"
pnpm -r build || fail "pnpm -r build"

echo "check: 2/2 pnpm -r test"
pnpm -r test || fail "pnpm -r test"

echo "check: OK — every check green"
