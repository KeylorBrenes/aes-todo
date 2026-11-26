#!/usr/bin/env bash
# AES — Delegating a role to OpenCode (standard/06 §12: role binding).
#
# The orchestrator (Claude Code) delegates here the roles whose binding in .claude/aes.env starts with
# "opencode:" (e.g. AES_BIND_PROGRAMMER="opencode:deepseek/deepseek-flash"). It does the same as the
# cycle of a Claude Code subagent:
#   1. opens the branch's worktree (aes-wt.sh) and marks it as active;
#   2. runs `opencode run --agent <role>` there, with no GitHub or app credentials in the environment;
#      L1 = opencode.json's permissions, L2 = .opencode/plugin/aes-guard.js (the same hooks);
#   3. applies the end-of-role gate (.claude/hooks/subagent-gate.sh). If it fails, it resumes the session
#      ONCE with the reason, just like a SubagentStop hook;
#   4. records events, tokens and cost in .aes/runs/ and .aes/costs.csv;
#   5. prints the role's final report, the status and the cost, and closes the worktree if it is clean.
# Before running it checks that OpenCode accepts the options it uses (they change between versions), that
# there are no servers on AES_PORTS, and copies the pending notes from .aes/ into the worktree (outside it,
# OpenCode does not allow reading). The cost row is always recorded, also if OpenCode or the provider fail.
# The prompt carries the project language (AES_LANG), since the roles do not read aes.env.
#
# Usage:
#   aes-oc.sh run <role> <branch> [--model <provider/model>] [--] [additional instructions…]
#   aes-oc.sh report [<ID>]           accumulated cost per item and role (from .aes/costs.csv)
#   aes-oc.sh binding <role> [<branch>]  effective binding (the task's model level, or the role's)
#
# Examples:
#   aes-oc.sh run programmer task/US-001/TASK-001
#   aes-oc.sh run qa qa/US-001 -- "Only criteria AC-01 to AC-03."
#
# It is long: the orchestrator launches it in the background and waits for the notification.
# Exit: 0 = the role finished and passed the gate; 3 = it finished with the gate red or BLOCKED;
#       4 = OpenCode failed (provider, network, balance, free-plan limit, incompatible version);
#       5 = the role finished but this script failed afterwards: the gate is PENDING (it prints the
#           command to run it by hand); 6 = it did not run: there are servers on AES_PORTS;
#       2 = wrong usage.
set -Eeuo pipefail   # -E: the ERR trap also applies inside functions

main_root() { dirname "$(git rev-parse --path-format=absolute --git-common-dir)"; }
root=$(main_root)
cd "$root"
# .claude/aes.env gives the project's values; AES_BIND_* and AES_OC_* variables already in the
# environment take priority (e.g. AES_BIND_PROGRAMMER=opencode:other/model for one run).
overrides=$(env | grep -E '^(AES_BIND_|AES_OC_)[A-Z_]*=' || true)
# shellcheck source=/dev/null
[[ -f .claude/aes.env ]] && source .claude/aes.env
while IFS= read -r kv; do [[ -n "$kv" ]] && export "${kv?}"; done <<< "$overrides"

die() { echo "aes-oc: $*" >&2; exit 2; }
# OpenCode events: only the lines that are JSON. If OpenCode prints something else (the help, a warning,
# a startup error), it does not break the parsing. jq's output is never cut with head: on Windows,
# closing the pipe makes jq fail ("writing output failed") and, with pipefail, the script.
events() { local f; for f in "$@"; do [[ -s "$f" ]] && jq -cR 'fromjson? | objects' "$f"; done; return 0; }
upper() { tr '[:lower:]' '[:upper:]' <<< "$1"; }

# --- Cost ----------------------------------------------------------------------------------------
# List price in USD per million (uncached input, output, cached input) and expensive slots in
# UTC (Monday to Friday) in which the price doubles. They estimate the real cost even if the
# model is free or OpenCode only knows the cheap price. Empty = OpenCode's cost is used.
list_price=${AES_OC_LIST_PRICE:-}
peak_utc=${AES_OC_PEAK_UTC:-}

summarize() { # $1.. event files → "steps input output reasoning cache cost_oc cost_est"
  events "$@" | jq -rs --arg price "$list_price" --arg peak "$peak_utc" '
    def ranges: ($peak | split(" ") | map(select(length > 0) | split("-") | map(tonumber)));
    def is_peak($ts): ($ts / 1000 | gmtime) as $t
      | ($t[6] >= 1 and $t[6] <= 5) and any(ranges[]; $t[3] >= .[0] and $t[3] < .[1]);
    ($price | split(" ") | map(select(length > 0) | tonumber)) as $p
    | [ .[] | select(.type == "step_finish") ] as $steps
    | [ $steps[] | .part.tokens as $k
        | { i: ($k.input // 0), o: ($k.output // 0), r: ($k.reasoning // 0), c: ($k.cache.read // 0),
            oc: (.part.cost // 0),
            f: (if (.timestamp != null) and is_peak(.timestamp) then 2 else 1 end) } ] as $rows
    | [ ($rows | length),
        ($rows | map(.i) | add // 0), ($rows | map(.o) | add // 0), ($rows | map(.r) | add // 0),
        ($rows | map(.c) | add // 0), ($rows | map(.oc) | add // 0),
        (if ($p | length) == 3
           then ($rows | map((.i * $p[0] + (.o + .r) * $p[1] + .c * $p[2]) / 1000000 * .f) | add // 0)
           else ($rows | map(.oc) | add // 0) end) ]
    | map(tostring) | join(" ")'
}

report() {
  local csv=.aes/costs.csv id=${1:-}
  [[ -f "$csv" ]] || { echo "No records yet (.aes/costs.csv)."; return 0; }
  awk -F, -v id="$id" 'NR > 1 && (id == "" || $2 == id) {
      k = $2 " " $4 " " $5; n[k]++; t[k] += $13; tok[k] += $8 + $9 + $10 + $11; tot += $13 }
    END {
      printf "%-12s %-11s %-34s %6s %14s %12s\n", "Item", "Role", "Model", "Runs", "Tokens", "USD (est.)"
      for (k in n) { split(k, a, " "); printf "%-12s %-11s %-34s %6d %14d %12.4f\n", a[1], a[2], a[3], n[k], tok[k], t[k] }
      printf "%-12s %-11s %-34s %6s %14s %12.4f\n", "TOTAL", "", "", "", "", tot }' "$csv"
}

# --- Commands ------------------------------------------------------------------------------------
cmd=${1:-}; shift || true
case "$cmd" in
  report)  report "${1:-}"; exit 0 ;;
  binding) [[ -n "${1:-}" ]] || die "usage: aes-oc.sh binding <role> [<branch>]"; bash .claude/scripts/aes-bind.sh "$1" "${2:-}"; exit 0 ;;
  run)     ;;
  *)       sed -n '2,/^set -Eeuo/p' "$0" | sed '$d'; exit 2 ;;
esac

role=${1:-}; branch=${2:-}; shift 2 || die "usage: aes-oc.sh run <role> <branch> [--model m] [--] [instructions]"
case "$role" in programmer|mechanic|qa) ;; *) die "role cannot be delegated to OpenCode: '$role' (programmer, mechanic or qa)" ;; esac
model=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --model) model=${2:?}; shift 2 ;;
    --) shift; break ;;
    *) break ;;
  esac
done
extra="$*"
if [[ -z "$model" ]]; then
  # Effective binding for this branch: the task's model level (aes-bind.sh) or the role's.
  b=$(bash .claude/scripts/aes-bind.sh "$role" "$branch")
  [[ "$b" == opencode:* ]] || die "the binding of '$role' for $branch is '${b:-empty}', not OpenCode: delegate to the Claude Code subagent${b#claude:} (aes-cycle, \"Delegating\")."
  model=${b#opencode:}
fi
command -v opencode >/dev/null || die "opencode is missing from the PATH."
command -v jq >/dev/null || die "jq is missing from the PATH."
# Options of `opencode run` this script uses: they change between versions (1.x had --dir; 2.2 no longer does).
oc_help=$(opencode run --help 2>&1 || true)
for flag in --agent --model --format --session --title; do
  grep -q -- "$flag" <<< "$oc_help" || {
    echo "aes-oc: this OpenCode version ($(opencode --version 2>/dev/null || echo '?')) does not accept '$flag' in 'opencode run'. Tested versions: ${AES_OC_TESTED:-none}. Run bash .claude/scripts/aes-doctor.sh." >&2
    exit 4; }
done
# shellcheck source=/dev/null
source .claude/hooks/lib.sh
busy=""; for port in ${AES_PORTS:-}; do port_listening "$port" && busy+=" $port"; done
if [[ -n "$busy" ]]; then
  echo "aes-oc: there are servers listening on:$busy (the demo?). The end-of-role gate would fail. Stop them and run again." >&2
  exit 6
fi

# Item and task, from the branch.
if [[ "$branch" =~ ^task/([^/]+)/([^/]+)$ ]]; then item=${BASH_REMATCH[1]}; task="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
elif [[ "$branch" =~ ^qa/([^/]+)$ ]]; then item=${BASH_REMATCH[1]}; task=$item
elif [[ "$branch" =~ ^spec/([^/]+)-close$ ]]; then item=${BASH_REMATCH[1]}; task="$item (cierre)"
else die "unrecognized branch: '$branch' (task/<ID>/<TASK>, qa/<ID> or spec/<ID>-close)"; fi

wt=$(bash .claude/scripts/aes-wt.sh open "$branch" | tail -n1)
[[ -d "$wt" ]] || die "could not open the worktree of $branch"
mkdir -p .aes "$wt/.aes"; printf '%s\n' "$wt" > .aes/active-worktree
# .aes/ does not go to git in any checkout (the .gitignore may not be on the branch yet).
exclude="$(git rev-parse --path-format=absolute --git-common-dir)/info/exclude"
grep -qxF '.aes/' "$exclude" 2>/dev/null || { mkdir -p "$(dirname "$exclude")"; echo '.aes/' >> "$exclude"; }
# The cycle's pending notes, for the close (M1): OpenCode does not read outside the worktree.
for f in .aes/*-pending.md; do [[ -f "$f" ]] && cp "$f" "$wt/.aes/"; done
stamp=$(date -u +%Y%m%dT%H%M%SZ)
runs=".aes/runs/${branch//\//-}"; mkdir -p "$runs"
ev1="$runs/$stamp.jsonl"; ev2="$runs/$stamp.retry.jsonl"; gatelog="$runs/$stamp.gate.log"
cleanup() { rm -f "$root/.aes/active-worktree"; }
trap cleanup EXIT

prompt="You are the AES $role role. Project language: ${AES_LANG:-en} (write everything in it). Item: $task. You are already in your own checkout of the branch $branch: do not switch branches, publish or open PRs (the orchestrator does that).
Follow your contract (it is in your instructions) and read the files in specs/$item/ it indicates. End with your final report in the contract's format, starting with the proposed status."
[[ -n "$extra" ]] && prompt+=$'\n\nOrchestrator instructions:\n'"$extra"

# Runs OpenCode with a watchdog (portable: it does not depend on `timeout`, which macOS does not ship):
#   - if the last event is the model's final close (step_finish with reason "stop") and nothing
#     new arrives in AES_OC_IDLE seconds, it treats the run as finished and closes OpenCode (`opencode run`
#     has been seen staying alive after finishing);
#   - if AES_OC_TIMEOUT seconds pass in total, it cuts it off (code 124).
# No app or GitHub credentials in its environment: publishing is the orchestrator's (06 §10).
oc() { # $1 events file, $2 errors file, rest: arguments of opencode run
  local out=$1 err=$2; shift 2
  (
    unset AES_APP_ID AES_APP_INSTALLATION_ID AES_APP_PRIVATE_KEY GH_TOKEN GITHUB_TOKEN
    export AES_ROLE="$role"
    cd "$wt" && exec opencode run --agent "$role" -m "$model" --format json "$@"
  ) > "$out" 2>> "$err" &
  local pid=$! limit=${AES_OC_TIMEOUT:-3600} idle_max=${AES_OC_IDLE:-30} t=0 idle=0 size=-1 now
  while kill -0 "$pid" 2>/dev/null; do
    sleep 2; t=$((t + 2))
    now=$(wc -c < "$out" | tr -d ' ')
    if [[ "$now" == "$size" ]]; then idle=$((idle + 2)); else idle=0; size=$now; fi
    if (( idle >= idle_max )) && tail -n 1 "$out" | grep -q '"type":"step_finish"' \
       && tail -n 1 "$out" | grep -q '"reason":"stop"'; then
      kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; return 0
    fi
    if (( t >= limit )); then
      kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true
      echo "aes-oc: OpenCode exceeded AES_OC_TIMEOUT (${limit}s)." >> "$err"; return 124
    fi
  done
  wait "$pid"
}

csv=.aes/costs.csv
record() { # $1 status, rest: event files. It never fails: the cost is always recorded.
  local st=$1; shift
  local steps=0 tin=0 tout=0 treas=0 tcache=0 cost_oc=0 cost_est=0 line
  line=$(summarize "$@" 2>/dev/null || true)
  [[ -n "$line" ]] && read -r steps tin tout treas tcache cost_oc cost_est <<< "$line"
  [[ -f "$csv" ]] || echo "fecha_utc,elemento,rama,rol,modelo,sesion,pasos,entrada,salida,razonamiento,cache,usd_opencode,usd_estimado,estado" > "$csv"
  printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' "$stamp" "$item" "$branch" "$role" "$model" "${session:-}" \
    "$steps" "$tin" "$tout" "$treas" "$tcache" "$cost_oc" "$cost_est" "$st" >> "$csv" || true
  COST_LINE=$(printf '%s steps · %s input · %s output · %s reasoning · %s cached · USD %s (OpenCode) · USD %s (estimated)' \
    "$steps" "$tin" "$tout" "$treas" "$tcache" "$cost_oc" "$cost_est")
}

echo "aes-oc: $role on $branch with $model (worktree $wt)" >&2
rc=0; session=""; : > "$runs/$stamp.err"; oc "$ev1" "$runs/$stamp.err" --title "$branch" "$prompt" || rc=$?
session=$(events "$ev1" | jq -rs 'map(.sessionID // empty) | first // ""')
errors=$(events "$ev1" | jq -rs 'map(select(.type == "error") | (.error.data.message // .error.name // "error")) | join("\n")')
if [[ $rc -ne 0 || -z "$session" || -n "$errors" ]]; then
  record opencode-error "$ev1"
  echo "aes-oc: OpenCode failed (code $rc)." >&2
  [[ -n "$errors" ]] && printf '%s\n' "$errors" >&2
  grep -q '"type"' "$ev1" 2>/dev/null || echo "aes-oc: OpenCode produced no JSON events (incompatible version? run aes-doctor.sh)." >&2
  grep -qiE 'FreeUsageLimit|usage limit|429' <<< "$errors" \
    && echo "aes-oc: it is the provider's usage limit. With a free model, change the binding to a paid one (AES_BIND_* in .claude/aes.env)." >&2
  tail -n 5 "$runs/$stamp.err" >&2 || true
  echo "aes-oc: the commits the role managed to make are still on $branch (git log origin/dev..$branch)." >&2
  exit 4
fi

# From here on the role has finished: a script failure must not lose its work or its cost.
gate_cmd="jq -n --arg r $role --arg c \"$wt\" '{agent_type: \$r, cwd: \$c, stop_hook_active: false}' | bash .claude/hooks/subagent-gate.sh"
files=("$ev1")
after_role_failed() {
  trap - ERR
  record script-error "${files[@]}"
  echo "aes-oc: the role finished, but this script failed afterwards (line $1). The gate is PENDING." >&2
  echo "aes-oc: run it by hand: $gate_cmd" >&2
  echo "aes-oc: the role's events and report in $runs/$stamp*.jsonl" >&2
  exit 5
}
trap 'after_role_failed $LINENO' ERR

gate() { # $1 = log file
  jq -n --arg r "$role" --arg c "$wt" '{agent_type: $r, cwd: $c, stop_hook_active: false}' \
    | bash .claude/hooks/subagent-gate.sh > /dev/null 2> "$1"
}
status=ok
if ! gate "$gatelog"; then
  echo "aes-oc: the end-of-role gate failed; resuming the session once." >&2
  retry_msg="The AES end-of-role check failed:
$(cat "$gatelog")
Fix it without touching protected tests or leaving the surface and give your final report again, or end with BLOCKED and the cause."
  oc "$ev2" "$runs/$stamp.err" --session "$session" "$retry_msg" || true
  files+=("$ev2")
  if ! gate "$gatelog.2"; then status=gate-failed; gatelog="$gatelog.2"; fi
fi

final=$(events "${files[@]}" | jq -rs '[.[] | select(.type == "text") | .part.text] | last // ""')
# shellcheck disable=SC2016  # the backticks are part of the pattern
blocked_re='(estado( propuesto)?|(proposed )?status)[^a-z]{0,4}[:=][[:space:]*`]*BLOCKED|^[[:space:]*`#-]*BLOCKED'
if grep -qiE "$blocked_re" <<< "$final"; then status=blocked; fi

record "$status" "${files[@]}"
trap - ERR
opencode export "$session" > "$runs/$stamp.session.json" 2>/dev/null || true

base=$(cd "$wt" && bash .claude/scripts/aes-base.sh 2>/dev/null || echo origin/dev)
{
  echo "=== AES · $role · $branch · $model ==="
  echo "Gate status: $status"
  echo "Cost: $COST_LINE"
  echo "Session: $session (events in $runs/)"
  echo "--- commits ---"; git -C "$wt" log --oneline "$base"..HEAD 2>/dev/null || true
  echo "--- files ---"; git -C "$wt" diff --stat "$base"...HEAD 2>/dev/null | tail -n 20 || true
  if [[ $status == gate-failed ]]; then echo "--- gate ---"; tail -n 30 "$gatelog"; fi
  echo "--- role report ---"; printf '%s\n' "$final"
} || true

if [[ -z "$(git -C "$wt" status --porcelain -- . ':!.aes' 2>/dev/null)" ]]; then
  bash .claude/scripts/aes-wt.sh close "$branch" >/dev/null 2>&1 || true
else
  echo "(The worktree $wt stays open: it has uncommitted changes.)"
fi
[[ $status == ok ]] && exit 0 || exit 3
