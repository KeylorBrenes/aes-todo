#!/usr/bin/env bash
# AES 1.3.0 — WorktreeRemove: cierra el worktree del subagente al terminar.
# Los commits quedan en la rama de trabajo; solo se elimina el directorio. Si quedaron cambios
# sin commit, el worktree se conserva para que el orquestador los revise (no se pierde nada).
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
  echo "AES worktree-remove: $path se conserva (cambios sin commit)." >&2
fi
exit 0
