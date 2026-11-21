#!/usr/bin/env bash
# AES — Ejecuta gh con la identidad de la GitHub App de los agentes.
# Así los PR que abren los agentes aparecen como <app>[bot] y tú puedes aprobarlos.
# En modo personal (AES_IDENTITY=personal en .claude/aes.env, sin app), usa tu sesión de gh.
# Uso: bash .claude/scripts/agent-gh.sh pr create --title "..." --body "..."
set -euo pipefail
root=$(git rev-parse --show-toplevel)
# shellcheck source=/dev/null
[[ -f "$root/.claude/aes.env" ]] && source "$root/.claude/aes.env"
if [[ "${AES_IDENTITY:-app}" == personal ]]; then exec gh "$@"; fi
GH_TOKEN=$(bash "$(dirname "$0")/gh-app-token.sh")
export GH_TOKEN
exec gh "$@"
