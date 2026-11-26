#!/usr/bin/env bash
# AES — Runs gh with the identity of the agents' GitHub App.
# That way the PRs the agents open appear as <app>[bot] and you can approve them.
# In personal mode (AES_IDENTITY=personal in .claude/aes.env, no app), it uses your gh session.
# Usage: bash .claude/scripts/agent-gh.sh pr create --title "..." --body "..."
set -euo pipefail
root=$(git rev-parse --show-toplevel)
# shellcheck source=/dev/null
[[ -f "$root/.claude/aes.env" ]] && source "$root/.claude/aes.env"
if [[ "${AES_IDENTITY:-app}" == personal ]]; then exec gh "$@"; fi
GH_TOKEN=$(bash "$(dirname "$0")/gh-app-token.sh")
export GH_TOKEN
exec gh "$@"
