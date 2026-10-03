#!/usr/bin/env bash
# Every check this repository has to pass, in order, before a push: the pre-push hook runs this file.
# It stops at the first red step and names it. The build is local; test suites run remotely.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

fail() {
  echo "check: FAIL — $1"
  exit 1
}

command -v pnpm >/dev/null 2>&1 || fail "pnpm is not on this machine (PATH)"
[ -d node_modules ] || fail "node_modules is missing; run pnpm install --frozen-lockfile first"

echo "check: 1/1 pnpm -r build"
pnpm -r build || fail "pnpm -r build"

echo "not run locally: @digitaplatform/design-css (runs in GitHub Actions on every push)"
echo "not run locally: @digitaplatform/signature-build (runs in GitHub Actions on every push)"
echo "not run locally: @digitaplatform/signature-kit (runs in GitHub Actions on every push)"
echo "not run locally: @digitaplatform/usermenu (runs in GitHub Actions on every push)"

echo "check: OK — local checks green; tests not run locally"
