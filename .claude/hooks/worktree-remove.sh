#!/usr/bin/env bash
# AES — WorktreeRemove: closes the subagent's worktree when it finishes.
# The commits stay on the work branch; only the directory is removed. If uncommitted changes
# were left, the worktree is kept so the orchestrator can review them (nothing is lost).
set -uo pipefail

input=$(cat)
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")
path=$(jq -r '.worktree_path // .path // empty' <<< "$input" 2>/dev/null)
[[ -z "$path" && -s "$root/.aes/active-worktree" ]] && path=$(tr -d '\r\n' < "$root/.aes/active-worktree")
[[ -n "$path" && -d "$path" ]] || exit 0

branch=$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null)
if bash "$root/.claude/scripts/aes-wt.sh" close "$branch"; then
  rm -f "$root/.aes/active-worktree"
else
  echo "AES worktree-remove: $path is kept (uncommitted changes)." >&2
fi
exit 0
