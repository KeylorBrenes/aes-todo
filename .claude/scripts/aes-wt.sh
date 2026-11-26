#!/usr/bin/env bash
# AES — Each role's own checkout (standard/06 §10) with git worktree.
#
# The main checkout always stays on `dev`. Each work branch is opened in its own
# worktree, in .claude/worktrees/<branch with / changed to ->. A branch can only be in one
# worktree at a time (a git rule): close yours before delegating on the same branch.
#
# Usage:
#   aes-wt.sh open <branch> [<base>]   creates the worktree (and the branch from <base>, origin/dev by default,
#                                      if it does not exist) and prints its path
#   aes-wt.sh close <branch>           removes it if it is clean (the commits stay on the branch)
#   aes-wt.sh path <branch>            prints the path (whether it exists or not)
#   aes-wt.sh run <branch> -- <cmd…>   opens, runs <cmd> inside and closes
#   aes-wt.sh delegate <branch>        prepares the delegation: the next subagent with
#                                      `isolation: worktree` will work on <branch> (read by worktree-create.sh)
set -euo pipefail

main_root() {  # root of the main checkout, even when called from a worktree
  local common
  common=$(git rev-parse --path-format=absolute --git-common-dir)
  dirname "$common"
}
root=$(main_root)
wt_dir="$root/.claude/worktrees"
wt_path() { printf '%s/%s' "$wt_dir" "${1//\//-}"; }

# Unversioned local files the role needs (06 §10). Add your project's here.
AES_WT_LOCAL_FILES=(.claude/settings.local.json)
copy_local_files() {
  local dest="$1" f
  for f in "${AES_WT_LOCAL_FILES[@]}"; do
    [[ -f "$root/$f" ]] && { mkdir -p "$dest/$(dirname "$f")"; cp "$root/$f" "$dest/$f"; }
  done
  return 0
}

cmd="${1:-}"; branch="${2:-}"
case "$cmd" in
  open)
    [[ -n "$branch" ]] || { echo "Usage: aes-wt.sh open <branch> [<base>]" >&2; exit 2; }
    base="${3:-origin/dev}"
    path=$(wt_path "$branch")
    if [[ -d "$path" ]]; then echo "$path"; exit 0; fi
    mkdir -p "$wt_dir"
    git -C "$root" fetch -q origin 2>/dev/null || true
    if git -C "$root" show-ref --verify --quiet "refs/heads/$branch"; then
      git -C "$root" worktree add -q "$path" "$branch" >&2
    elif git -C "$root" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
      git -C "$root" worktree add -q --track -b "$branch" "$path" "origin/$branch" >&2
    else
      git -C "$root" worktree add -q --no-track -b "$branch" "$path" "$base" >&2
    fi
    copy_local_files "$path"
    echo "$path"
    ;;
  close)
    [[ -n "$branch" ]] || { echo "Usage: aes-wt.sh close <branch>" >&2; exit 2; }
    path=$(wt_path "$branch")
    [[ -d "$path" ]] || exit 0
    for f in "${AES_WT_LOCAL_FILES[@]}"; do rm -f "${path:?}/$f"; done   # local copies, in .gitignore
    if [[ -n "$(git -C "$path" status --porcelain)" ]]; then
      echo "AES: $path has uncommitted changes; it is not removed. Review them before closing." >&2
      copy_local_files "$path"; exit 1
    fi
    git -C "$root" worktree remove "$path"
    # On Windows, the empty folder may stay locked for a moment (antivirus, indexer).
    for _ in 1 2 3; do [[ -d "$path" ]] || break; rm -rf "${path:?}" 2>/dev/null || sleep 1; done
    if [[ -d "$path" ]]; then
      echo "AES: git already closed the worktree, but the folder $path is still there (on Windows, because a process or a terminal has its current directory inside it). Leave it and delete it: rm -rf \"$path\"" >&2
    fi
    ;;
  path)
    wt_path "$branch"; echo
    ;;
  run)
    [[ -n "$branch" && "${3:-}" == "--" ]] || { echo "Usage: aes-wt.sh run <branch> -- <cmd…>" >&2; exit 2; }
    shift 3
    path=$("$0" open "$branch")
    status=0
    (cd "$path" && "$@") || status=$?
    "$0" close "$branch" || status=1
    exit $status
    ;;
  delegate)
    [[ -n "$branch" ]] || { echo "Usage: aes-wt.sh delegate <branch>" >&2; exit 2; }
    if [[ -d "$(wt_path "$branch")" ]]; then
      echo "AES: the branch $branch is already open in $(wt_path "$branch"). Close it (aes-wt.sh close) before delegating." >&2
      exit 1
    fi
    git -C "$root" show-ref --verify --quiet "refs/heads/$branch" || {
      echo "AES: the branch $branch does not exist yet. Create it with aes-wt.sh open and close it, or with git branch." >&2; exit 1; }
    mkdir -p "$root/.aes"
    printf '%s\n' "$branch" > "$root/.aes/next-branch"
    echo "Delegation prepared: the next subagent will work on $branch."
    ;;
  *)
    echo "Usage: aes-wt.sh open|close|path|run|delegate <branch> …" >&2; exit 2 ;;
esac
