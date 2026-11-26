#!/usr/bin/env bash
# AES — PreToolUse (Edit|Write|MultiEdit|NotebookEdit). Layer L2.
# Decides by role (agent_type) which repo files it can write.
#   orchestrator (no agent_type): documentation and specifications; NOT code or tests.
#   qa:                           only tests/acceptance/**, specs/<ID>/acceptance-test-plan.md and specs/<ID>/*.verify
#   programmer / mechanic:        only inside the task's surface (branch task/<ID>/<TASK>)
#   verifier and anyone else:     nothing inside the repo
# Outside the repo (e.g. /tmp) there is no restriction: the verifier can create temporary scripts.
set -uo pipefail
# shellcheck source=/dev/null
source "$(dirname "$0")/lib.sh"

aes_read_input
AES_ROLE=$(aes_role)
file=$(aes_get '.tool_input.file_path')
[[ -z "$file" ]] && file=$(aes_get '.tool_input.notebook_path')
[[ -z "$file" ]] && exit 0

cwd=$(aes_get '.cwd'); [[ -z "$cwd" ]] && cwd=$PWD
root=$(aes_repo_root "$(aes_norm "$file")")
[[ -z "$root" ]] && root=$(aes_repo_root "$cwd")
[[ -z "$root" ]] && exit 0
rel=$(aes_rel_path "$file" "$root")
[[ -z "$rel" ]] && exit 0   # outside the repository

case "$AES_ROLE" in
  "")
    if [[ "$rel" =~ ^(src|web|tests)/ ]]; then
      aes_block "the orchestrator does not write code or tests ('$rel'). Delegate to programmer, mechanic or qa."
    fi
    ;;
  qa)
    if [[ ! "$rel" =~ ^tests/acceptance/ && ! "$rel" =~ ^specs/[^/]+/acceptance-test-plan\.md$ && ! "$rel" =~ ^specs/[^/]+/[^/]+\.verify$ ]]; then
      aes_block "QA only writes in tests/acceptance/, specs/<ID>/acceptance-test-plan.md and specs/<ID>/*.verify ('$rel')."
    fi
    ;;
  programmer|mechanic)
    if [[ "$rel" =~ $AES_PROTECTED_RE ]]; then
      aes_block "'$rel' is a protected path. If you need to change it, stop and report BLOCKED with the reason."
    fi
    branch=$(aes_branch "$root")
    # mechanic consolidates documentation at close: on spec/<ID>-close it can only touch docs/.
    if [[ "$AES_ROLE" == "mechanic" && "$branch" =~ ^spec/[^/]+-close$ ]]; then
      [[ "$rel" =~ ^docs/ ]] && exit 0
      aes_block "on the close branch '$branch' you can only write in docs/ ('$rel')."
    fi
    scope_rel=$(aes_scope_file "$branch")
    if [[ -z "$scope_rel" ]]; then
      aes_block "you are on the branch '$branch'. Implementation only happens on task/<ID>/<TASK> branches. Report BLOCKED."
    fi
    if [[ ! -f "$root/$scope_rel" ]]; then
      aes_block "the surface '$scope_rel' does not exist. The orchestrator must publish it first. Report BLOCKED."
    fi
    if ! aes_in_scope "$rel" "$root/$scope_rel"; then
      aes_block "'$rel' is outside the task's surface ($scope_rel). Do not widen the scope: report BLOCKED and explain why you need it."
    fi
    ;;
  *)
    aes_block "the role '$AES_ROLE' cannot write repository files ('$rel')."
    ;;
esac
exit 0
