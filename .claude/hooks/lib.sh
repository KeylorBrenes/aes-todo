#!/usr/bin/env bash
# AES — functions shared by the hooks. Loaded with: source "$(dirname "$0")/lib.sh"

# Paths no implementation role can touch (used in role-guard.sh).
# shellcheck disable=SC2034
AES_PROTECTED_RE='^(tests/acceptance/|specs/|ci/|\.github/|\.claude/|\.opencode/|docs/ci/|opencode\.json$|AGENTS\.md$|CLAUDE\.md$)'

# Reads the hook's JSON input once.
aes_read_input() { AES_INPUT=$(cat); }
aes_get() { jq -r "$1 // empty" <<< "$AES_INPUT"; }

# Role: empty = main session (orchestrator). Otherwise, the subagent's name.
aes_role() { aes_get '.agent_type'; }

# Normalizes a path (Windows or POSIX) to a form with "/" and without "./".
aes_norm() { local p="${1//\\//}"; printf '%s' "${p#./}"; }

# Root of the repository that contains a path (or the hook's cwd).
aes_repo_root() {
  local dir="$1"
  [[ -d "$dir" ]] || dir=$(dirname "$dir")
  while [[ ! -d "$dir" && "$dir" != "." && "$dir" != "/" ]]; do dir=$(dirname "$dir"); done
  git -C "$dir" rev-parse --show-toplevel 2>/dev/null || git rev-parse --show-toplevel 2>/dev/null
}

# Turns an absolute path into one relative to the repo's root (case-insensitive comparison,
# because on Windows "h:/" and "H:/" are the same drive). Prints nothing if it is outside the repo.
aes_rel_path() {
  local file root lf lr
  file=$(aes_norm "$1"); root=$(aes_norm "$2")
  # Git Bash may return /h/Projects instead of H:/Projects: unify.
  if [[ "$root" =~ ^/([a-zA-Z])/(.*)$ ]]; then root="${BASH_REMATCH[1]}:/${BASH_REMATCH[2]}"; fi
  if [[ "$file" =~ ^/([a-zA-Z])/(.*)$ ]]; then file="${BASH_REMATCH[1]}:/${BASH_REMATCH[2]}"; fi
  # Relative path: it is already relative to the repo.
  if [[ ! "$file" =~ ^([a-zA-Z]:)?/ ]]; then printf '%s' "$file"; return; fi
  lf=$(tr '[:upper:]' '[:lower:]' <<< "$file"); lr=$(tr '[:upper:]' '[:lower:]' <<< "$root")
  if [[ "$lf" == "$lr"/* ]]; then printf '%s' "${file:${#root}+1}"; fi
}

# Current branch and its .scope file (task/<ID>/<TASK> → specs/<ID>/<TASK>.scope).
aes_branch() { git -C "$1" rev-parse --abbrev-ref HEAD 2>/dev/null; }
aes_scope_file() {
  local branch="$1"
  if [[ "$branch" =~ ^task/([^/]+)/([^/]+)$ ]]; then
    printf 'specs/%s/%s.scope' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
  fi
}

# Does the relative path match any glob in the .scope?
aes_in_scope() {
  local rel="$1" scope="$2" glob
  while IFS= read -r glob || [[ -n "$glob" ]]; do
    glob="${glob%%#*}"; glob="${glob//[[:space:]]/}"; glob="${glob//$'\r'/}"
    [[ -z "$glob" ]] && continue
    # shellcheck disable=SC2053  # the glob must be evaluated as a pattern
    [[ "$rel" == $glob ]] && return 0
  done < "$scope"
  return 1
}

aes_block() { printf 'AES [%s]: %s\n' "${AES_ROLE:-orchestrator}" "$*" >&2; exit 2; }

# Is a process listening on the port? Linux: /proc/net/tcp(6) (does not depend on ss/netstat).
# Windows/macOS: netstat (whose output may be localized: ESCUCHANDO). Used by subagent-gate.sh and .claude/scripts/aes-oc.sh.
port_listening() {
  local port="$1" hex
  if [[ -r /proc/net/tcp ]]; then
    local files=(/proc/net/tcp)
    [[ -r /proc/net/tcp6 ]] && files+=(/proc/net/tcp6)
    hex=$(printf '%04X' "$port")
    awk -v h=":${hex}" '$4 == "0A" && substr($2, length($2) - 4) == h { found = 1 } END { exit !found }' \
      "${files[@]}" 2>/dev/null
  elif command -v netstat >/dev/null 2>&1; then
    { netstat -ano 2>/dev/null || netstat -an 2>/dev/null; } | grep -iE "[:.]${port}[[:space:]].*(LISTENING|ESCUCHANDO|LISTEN)" >/dev/null
  else
    return 1
  fi
}
