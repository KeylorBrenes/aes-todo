#!/usr/bin/env bash
# AES — PreToolUse (Bash and PowerShell). Layer L2: friction, not a guarantee.
# The terminal can write files even if Edit/Write are blocked. This hook intercepts
# the obvious cases; the real guarantee is the CI guard (L3).
set -uo pipefail
# shellcheck source=/dev/null
source "$(dirname "$0")/lib.sh"

aes_read_input
AES_ROLE=$(aes_role)
cmd=$(aes_get '.tool_input.command')
[[ -z "$cmd" ]] && exit 0

# Paths this role cannot write (unanchored; combined below).
case "$AES_ROLE" in
  "")                    paths='(src|web|tests)(/|[[:space:]"'\'']|$)' ;;
  qa)                    paths='((src|web|specs|ci|\.github|\.claude|\.opencode)(/|[[:space:]"'\'']|$)|opencode\.json|AGENTS\.md|CLAUDE\.md)' ;;
  programmer|mechanic)   paths='((tests/acceptance|specs|ci|\.github|\.claude|\.opencode|docs/ci)(/|[[:space:]"'\'']|$)|opencode\.json|AGENTS\.md|CLAUDE\.md)' ;;
  *)                     paths='' ;;
esac

# Only these count as writing:
#  - a redirection TO the path (> path, >> path), not "2>&1" or "> /dev/null";
#  - a write operation whose argument, in the same simple command, is the path.
if [[ -n "$paths" ]]; then
  redirect_re=">{1,2}[[:space:]]*[\"']?(\./)?${paths}"
  ops_re="(\btee\b|\bsed[[:space:]]+-i|\bperl[[:space:]]+-pi|\brm\b|\bmv\b|\bcp\b|\btruncate\b|\btouch\b|\bmkdir\b|Set-Content|Add-Content|Out-File|New-Item|Remove-Item|Move-Item|Copy-Item)[^;&|]*[[:space:]\"'=](\./)?${paths}"
fi

# Git and GitHub: subagents do not publish, switch branches or rewrite history.
if [[ -n "$AES_ROLE" ]]; then
  if [[ "$cmd" =~ (^|[;&|[:space:]])(git[[:space:]]+(push|switch|checkout|reset|rebase|merge|clean|worktree|branch[[:space:]]+-[dDmM])|gh[[:space:]]|agent-gh\.sh) ]]; then
    aes_block "subagents do not publish, switch branches or rewrite history. The orchestrator does that. Command: $cmd"
  fi
  if [[ "$cmd" =~ --no-verify ]]; then
    aes_block "skipping git hooks (--no-verify) is not allowed."
  fi
fi

# The verifier is read-only: it does not commit or write inside the repo.
if [[ "$AES_ROLE" == "verifier" ]]; then
  if [[ "$cmd" =~ (^|[;&|[:space:]])git[[:space:]]+(add|commit|stash|apply|am|cherry-pick) ]]; then
    aes_block "the verifier is read-only (no add/commit/stash)."
  fi
  if [[ "$cmd" =~ (sed[[:space:]]+-i|perl[[:space:]]+-pi|Set-Content|Out-File) ]]; then
    aes_block "the verifier does not modify files."
  fi
fi

if [[ -n "$paths" ]] && [[ "$cmd" =~ $redirect_re || "$cmd" =~ $ops_re ]]; then
  aes_block "the command seems to write to a path this role cannot touch. If it is a read, rephrase it without redirections. Command: $cmd"
fi
exit 0
