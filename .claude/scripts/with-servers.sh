#!/usr/bin/env bash
# AES — Starts the API (and optionally the web app), runs a command and ALWAYS stops what it started.
#
# For the verifier's agentic manual test and any role that needs servers
# (FL-007: processes that outlive the role and contaminate the next role's evidence).
#   - It does not reuse servers: if a port is already taken, it fails.
#   - It uses its own temporary SQLite database.
#   - When it finishes (well, badly or with Ctrl+C) it stops the process tree it started, and only that one.
#
# Usage:
#   bash .claude/scripts/with-servers.sh [--web] -- <command> [args...]
# Examples:
#   bash .claude/scripts/with-servers.sh -- curl -s http://localhost:5080/api/categories
#   bash .claude/scripts/with-servers.sh --web -- node "$TEMP/manual-check.mjs"
#
# Configuration: .claude/aes.env (AES_API_CMD, AES_API_HEALTH, AES_WEB_CMD, AES_WEB_URL,
# AES_DB_VAR, AES_DB_VALUE). Environment variables already defined take priority.
#   AES_WAIT_SECONDS            (120 by default)
#
# It is not for acceptance with Playwright: its configuration starts its own servers on
# the same ports. It is the tool of the verifier's manual test.
set -uo pipefail

with_web=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --web) with_web=1; shift ;;
    --) shift; break ;;
    *) echo "Uso: with-servers.sh [--web] -- <comando> [args...]" >&2; exit 2 ;;
  esac
done
[[ $# -gt 0 ]] || { echo "The command to run after -- is missing" >&2; exit 2; }

root=$(git rev-parse --show-toplevel)
cd "$root" || exit 2
tmp=$(mktemp -d)
is_windows=0
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) is_windows=1 ;; esac

# The project's configuration (without overriding what already comes in the environment).
if [[ -f "$root/.claude/aes.env" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^AES_[A-Z_]+$ ]] || continue
    [[ -n "${!key:-}" ]] && continue
    value="${value%\"}"; value="${value#\"}"
    export "$key=$value"
  done < <(grep -E '^AES_[A-Z_]+=' "$root/.claude/aes.env" | tr -d '\r')
fi

db="$tmp/manual.db"
[[ $is_windows == 1 ]] && command -v cygpath >/dev/null && db=$(cygpath -m "$db")
api_cmd="${AES_API_CMD:?AES_API_CMD is missing in .claude/aes.env}"
api_health="${AES_API_HEALTH:?AES_API_HEALTH is missing in .claude/aes.env}"
web_cmd="${AES_WEB_CMD:-}"
web_url="${AES_WEB_URL:-}"
db_var="${AES_DB_VAR:-}"
db_value="${AES_DB_VALUE:-}"; db_value="${db_value//\{db\}/$db}"
wait_s="${AES_WAIT_SECONDS:-120}"
if [[ $with_web == 1 && ( -z "$web_cmd" || -z "$web_url" ) ]]; then
  echo "AES_WEB_CMD or AES_WEB_URL is missing in .claude/aes.env" >&2; exit 2
fi

pids=()
# shellcheck disable=SC2329  # invoked from trap EXIT
stop_all() {
  local pid winpid
  for pid in "${pids[@]}"; do
    if [[ $is_windows == 1 ]]; then
      # dotnet run / npm create native child processes: the whole tree must be stopped.
      winpid=$(cat "/proc/$pid/winpid" 2>/dev/null || true)
      [[ -n "$winpid" ]] && taskkill //PID "$winpid" //T //F >/dev/null 2>&1
      kill "$pid" 2>/dev/null
    else
      # Each server started in its own process group (setsid): the group is stopped.
      kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
      sleep 1
      kill -KILL -- "-$pid" 2>/dev/null || true
    fi
  done
  rm -rf "$tmp"
}
trap stop_all EXIT
trap 'exit 130' INT TERM

up() { curl -s -o /dev/null --max-time 2 "$1"; }

start() {  # start <nombre> <comando> <url>
  local name="$1" cmd="$2" url="$3" log="$tmp/$1.log" i
  if up "$url"; then
    echo "AES: $url already responds. There is a live server from another role or an earlier session; it is not reused (FL-007). Stop it and try again." >&2
    exit 3
  fi
  local envs=()
  [[ -n "$db_var" ]] && envs=("$db_var=$db_value")
  if [[ $is_windows == 1 ]]; then
    env "${envs[@]}" bash -c "$cmd" >"$log" 2>&1 &
  else
    env "${envs[@]}" setsid bash -c "$cmd" >"$log" 2>&1 &
  fi
  pids+=("$!")
  for ((i = 0; i < wait_s; i++)); do
    up "$url" && { echo "AES: $name ready at $url"; return 0; }
    kill -0 "${pids[${#pids[@]}-1]}" 2>/dev/null || break
    sleep 1
  done
  echo "AES: $name did not start. Last lines of its output:" >&2
  tail -n 30 "$log" >&2
  exit 4
}

start api "$api_cmd" "$api_health"
[[ $with_web == 1 ]] && start web "$web_cmd" "$web_url"

"$@"
status=$?
echo "AES: command finished (code $status); stopping servers."
exit "$status"
