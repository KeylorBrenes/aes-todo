#!/usr/bin/env bash
# AES — Runs verification commands (standard/05 §12), layer L3.
#
# A verification command is a versioned bash script in specs/<ID>/<name>.verify that
# exits with 0 if the criterion is met. It is treated as a protected test.
#
# Usage: run-verify.sh red|green <ref> <path.verify>...
#   green  each command must PASS. The copy from <ref> (the protected base) is run.
#   red    each command must FAIL against the current code (RED). The copy from <ref>
#          (the branch that proposes it) is run. A command that declares "# aes: no-red <reason>" in its
#          first 5 lines is exempt, and the reason is printed for human review.
#
# Variables: AES_VERIFY_TIMEOUT (seconds per command, 300 by default).
# Each command runs from the repo's root, with the current branch's code.
set -uo pipefail

mode="${1:-}"; ref="${2:-}"; shift 2 || true
case "$mode" in red|green) ;; *) echo "Usage: run-verify.sh red|green <ref> <path.verify>..." >&2; exit 2 ;; esac
[[ $# -gt 0 ]] || { echo "AES verify: no verification commands to run."; exit 0; }

root=$(git rev-parse --show-toplevel); cd "$root" || exit 2
timeout_s="${AES_VERIFY_TIMEOUT:-300}"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
fail=0

for path in "$@"; do
  copy="$tmp/$(tr '/' '_' <<< "$path")"
  if ! git show "$ref:$path" > "$copy" 2>/dev/null; then
    echo "FAIL [verify] $path does not exist in $ref."; fail=1; continue
  fi
  if [[ "$mode" == "red" ]]; then
    reason=$(head -n 5 "$copy" | sed -n 's/^#[[:space:]]*aes:[[:space:]]*no-red[[:space:]]*//p' | head -n1)
    if [[ -n "$reason" ]]; then
      echo "INFO [verify] $path declares no RED: $reason  (requires explicit human approval)"
      continue
    fi
  fi
  echo "── $path ($mode)"
  timeout "$timeout_s" bash "$copy" > "$tmp/out" 2>&1
  status=$?
  sed 's/^/   │ /' "$tmp/out" | tail -n 40
  if [[ "$mode" == "green" && $status -ne 0 ]]; then
    echo "FAIL [verify] $path had to pass and exited with code $status."; fail=1
  elif [[ "$mode" == "red" && $status -eq 0 ]]; then
    echo "FAIL [verify] $path PASSES against the current code: it shows neither the defect nor the absence of the change (RED)."; fail=1
  elif [[ "$mode" == "red" && $status -eq 124 ]]; then
    echo "FAIL [verify] $path exceeded the time limit: a timeout is not RED."; fail=1
  else
    echo "OK   [verify] $path (code $status)"
  fi
done
(( fail == 0 )) && echo "AES verify ($mode): OK"
exit $fail
