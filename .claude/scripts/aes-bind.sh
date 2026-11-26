#!/usr/bin/env bash
# AES — Effective binding of a role for a task (standard/06 §12.1).
#
# Each role has a default binding (AES_BIND_<ROLE> in .claude/aes.env) and one per level
# (AES_BIND_<ROLE>_<LEVEL>, e.g. AES_BIND_PROGRAMMER_HIGH). The task chooses the level with its
# "**Model level:**" field (written by the orchestrator and approved by the human in the qa/<ID> PR):
#   **Model level:** standard                         → AES_BIND_<ROLE>
#   **Model level:** high — <reason>                  → AES_BIND_<ROLE>_HIGH (if it does not exist, the standard one)
#   **Model level:** opencode:<provider>/<model>      → that binding, as is
#   **Model level:** claude:<sonnet|opus|haiku>       → a Claude Code subagent with that model
# Spanish task files ("**Nivel de modelo:** estándar / alto") and AES_BIND_<ROLE>_ALTO work too.
#
# Usage: aes-bind.sh <role> [<task file> | <branch>]
#   role: qa, programmer, mechanic or verifier. With a task/<ID>/<TASK> branch, it reads specs/<ID>/<TASK>.md
#   from the current checkout; with another branch or no task, the role's default binding.
# It prints the binding ("claude", "claude:<model>" or "opencode:<provider>/<model>") and, on stderr,
# where it came from.
set -euo pipefail
role=${1:?Uso: aes-bind.sh <rol> [<archivo de tarea> | <rama>]}; src=${2:-}
case "$role" in qa|programmer|mechanic|verifier) ;; *) echo "aes-bind: unknown role: $role" >&2; exit 2 ;; esac
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
overrides=$(env | grep -E '^AES_BIND_[A-Z_]*=' || true)
# shellcheck source=/dev/null
[[ -f "$root/.claude/aes.env" ]] && source "$root/.claude/aes.env"
while IFS= read -r kv; do [[ -n "$kv" ]] && export "${kv?}"; done <<< "$overrides"

R=$(tr '[:lower:]' '[:upper:]' <<< "$role")
def="AES_BIND_$R"; default=${!def:-claude}

file=""
if [[ "$src" =~ ^task/([^/]+)/([^/]+)$ ]]; then file="specs/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}.md"
elif [[ -n "$src" && -f "$src" ]]; then file=$src; fi
# The approved specification lives in origin/dev (or in the branch, if it is not merged yet).
level=""
if [[ -n "$file" ]]; then
  text=$(git -C "$root" show "origin/dev:$file" 2>/dev/null || cat "$root/$file" 2>/dev/null || cat "$file" 2>/dev/null || true)
  # "Model level" (English) or "Nivel de modelo" (Spanish).
  level=$(sed -nE 's/^[-*[:space:]]*\*\*(Model level|Nivel de modelo):\*\*[[:space:]]*//p' <<< "$text" | head -n1 | tr -d '\r')
fi
level=${level%%[[:space:]]—*}; level=${level%%[[:space:]]-[[:space:]]*}; level=${level%% (*}
level="${level%"${level##*[![:space:]]}"}"   # no trailing spaces

case "$level" in
  ""|estándar|estandar|Estándar|Estandar|standard|Standard)
    echo "aes-bind: $role → $default (default${file:+, $file})" >&2; printf '%s\n' "$default" ;;
  opencode:*|claude|claude:*)
    echo "aes-bind: $role → $level (set in $file)" >&2; printf '%s\n' "$level" ;;
  *)
    N=$level; N=${N//á/a}; N=${N//é/e}; N=${N//í/i}; N=${N//ó/o}; N=${N//ú/u}
    N=${N//Á/A}; N=${N//É/E}; N=${N//Í/I}; N=${N//Ó/O}; N=${N//Ú/U}
    N=$(tr '[:lower:]' '[:upper:]' <<< "$N" | tr -c 'A-Z0-9\n' '_')
    v="AES_BIND_${R}_${N}"
    # Aliases between languages: high ⇄ alto, max ⇄ maximo.
    if [[ -z "${!v:-}" ]]; then
      case "$N" in HIGH) alt=ALTO ;; ALTO) alt=HIGH ;; MAX|MAXIMUM) alt=MAXIMO ;; MAXIMO) alt=MAX ;; *) alt="" ;; esac
      if [[ -n "$alt" ]]; then a="AES_BIND_${R}_${alt}"; [[ -n "${!a:-}" ]] && v=$a; fi
    fi
    if [[ -n "${!v:-}" ]]; then echo "aes-bind: $role → ${!v} (level $level, $v)" >&2; printf '%s\n' "${!v}"
    else echo "aes-bind: $role → $default (level $level without $v in aes.env: the default is used)" >&2; printf '%s\n' "$default"; fi ;;
esac
