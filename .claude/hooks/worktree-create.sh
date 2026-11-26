#!/usr/bin/env bash
# AES — WorktreeCreate: the subagent works on the real work branch, not on a temporary
# branch (standard/06 §10). It replaces Claude Code's default logic.
#
# The orchestrator names the branch before delegating:  bash .claude/scripts/aes-wt.sh delegate <branch>
# This hook reads it from .aes/next-branch (single use), opens the worktree with aes-wt.sh, which copies
# the local files the role needs, and leaves the path in .aes/active-worktree for
# subagent-gate.sh. On stdout it prints only the path, which is what Claude Code expects.
#
# It fails closed: with no branch named it creates nothing, and the subagent does not start.
set -uo pipefail

input=$(cat)
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")
[[ -n "$root" && -d "$root" ]] || { echo "AES worktree-create: repository not found." >&2; exit 1; }

next="$root/.aes/next-branch"
if [[ ! -s "$next" ]]; then
  name=$(jq -r '.worktree_name // .name // empty' <<< "$input" 2>/dev/null)
  echo "AES worktree-create: no branch named for the worktree '${name:-?}'. The orchestrator must run 'aes-wt.sh delegate <branch>' before delegating." >&2
  exit 1
fi
branch=$(tr -d '\r\n' < "$next")
rm -f "$next"

if ! path=$(bash "$root/.claude/scripts/aes-wt.sh" open "$branch"); then
  echo "AES worktree-create: could not open the worktree of $branch." >&2
  exit 1
fi
printf '%s\n' "$path" > "$root/.aes/active-worktree"
printf '%s\n' "$path"
