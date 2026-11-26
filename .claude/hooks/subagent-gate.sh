#!/usr/bin/env bash
# AES — SubagentStop. Layer L2.
# Before an AES subagent finishes:
#   - all (qa, programmer, mechanic, verifier): they must not leave servers listening on the
#     project's ports (FL-007: they contaminate the next role's evidence);
#   - programmer and mechanic: also, the local AES guard and the project's validations
#     (ci/validate.sh, if it exists).
# It blocks ONCE (stop_hook_active avoids loops): if they keep failing, the agent must
# finish reporting BLOCKED **for the human**, and the orchestrator will see it.
set -uo pipefail
# shellcheck source=/dev/null
source "$(dirname "$0")/lib.sh"

aes_read_input
AES_ROLE=$(aes_role)
case "$AES_ROLE" in qa|programmer|mechanic|verifier) ;; *) exit 0 ;; esac
[[ "$(aes_get '.stop_hook_active')" == "true" ]] && exit 0

cwd=$(aes_get '.cwd'); [[ -z "$cwd" ]] && cwd=$PWD
root=$(aes_repo_root "$cwd")
[[ -z "$root" ]] && exit 0
# If the subagent worked in a worktree, the checks are done there.
main=$(dirname "$(git -C "$root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")
if [[ -s "$main/.aes/active-worktree" ]]; then
  wt=$(tr -d '\r\n' < "$main/.aes/active-worktree")
  [[ -d "$wt" ]] && root="$wt"
fi
cd "$root" || exit 0

failures=()
log=$(mktemp)

# 0. Live servers on the project's ports.
#    Linux: /proc/net/tcp(6) (does not depend on ss/netstat). Windows/macOS: netstat.
if [[ -z "${AES_PORTS:-}" && -f .claude/aes.env ]]; then
  AES_PORTS=$(sed -n 's/^AES_PORTS=//p' .claude/aes.env | tr -d '"\r' | head -n1)
fi
AES_PORTS="${AES_PORTS:-}"
listening=""
for port in $AES_PORTS; do
  port_listening "$port" && listening+=" $port"
done
if [[ -n "$listening" ]]; then
  failures+=("servers are still listening on the ports:$listening. Use .claude/scripts/with-servers.sh, which stops them by itself; if you cannot stop them, report BLOCKED for the human (do not ask another agent to do it)")
fi

if [[ "$AES_ROLE" == "qa" || "$AES_ROLE" == "verifier" ]]; then
  if (( ${#failures[@]} > 0 )); then
    printf 'AES [%s]: you cannot finish yet. %s\n' "$AES_ROLE" "${failures[*]}" >&2
    rm -f "$log"; exit 2
  fi
  rm -f "$log"; exit 0
fi

# 1. Local AES guard (same rules as CI) against the base branch (origin/dev, or origin/main in a hotfix).
#    Dependencies are not judged here: their approval is human and lives in CI
#    (label aes:deps-approved). Protected paths, surface, deleted tests and
#    markers do block.
branch=$(aes_branch "$root")
scope=$(aes_scope_file "$branch")
if [[ -n "$scope" ]]; then
  if ! AES_ALLOW_DEPS=1 BASE_REF="$(bash .claude/scripts/aes-base.sh)" TASK_SCOPE_FILE="$scope" bash ci/aes-guard.sh >>"$log" 2>&1; then
    failures+=("AES guard")
  fi
fi

# 2. Uncommitted changes: the work must end up in commits.
if [[ -n "$(git status --porcelain --untracked-files=normal -- . ':!**/bin/**' ':!**/obj/**')" ]]; then
  failures+=("there are uncommitted changes (git status is not clean)")
fi

# 3. The project's validations (ci/validate.sh: build, tests, lint). Only on task branches:
#    at close (spec/<ID>-close) mechanic only touches documentation.
if [[ -n "$scope" && -f ci/validate.sh ]]; then
  bash ci/validate.sh >>"$log" 2>&1 || failures+=("the project's validations (ci/validate.sh)")
fi

if (( ${#failures[@]} > 0 )); then
  {
    echo "AES [$AES_ROLE]: you cannot finish yet. Failed: ${failures[*]}."
    echo "Fix it without touching protected tests or leaving the surface, or finish reporting BLOCKED with the cause."
    echo "--- last lines ---"
    tail -n 40 "$log"
  } >&2
  rm -f "$log"
  exit 2
fi
rm -f "$log"
exit 0
