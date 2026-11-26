#!/usr/bin/env bash
# AES — Applies a workflow change prepared by the orchestrator. THE HUMAN runs it.
#
# The agents' identity has no Workflows permission (06 §10): that way no agent can change
# the CI that judges it. When an item needs to change .github/workflows/, the orchestrator leaves the
# new file in docs/ci/<name>.yml on a branch (usually spec/<ID>-ci) and asks you to run this
# in your terminal, with your own git session (not with the app):
#
#   bash .claude/scripts/aes-workflow.sh <branch>
#   bash .claude/scripts/aes-workflow.sh            (no branch: if dev has docs/ci/*.yml, it creates a branch
#                                                    spec/aes-workflow-<date> from dev and opens the PR)
#
# It shows the diff, asks for confirmation, moves docs/ci/*.yml to .github/workflows/ on that branch,
# commits with your identity and publishes it. After that, the PR's CI already runs with the new workflow.
set -euo pipefail
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
cd "$root"
[[ -z "${CLAUDECODE:-}${AES_ROLE:-}" ]] || { echo "aes-workflow: the human runs it, not an agent." >&2; exit 2; }
git fetch -q origin
branch=${1:-}; new_pr=0
if [[ -z "$branch" ]] || ! git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
  # The branch was already merged (and GitHub deleted it) or none was given: if dev has docs/ci/, start from dev.
  if git ls-tree --name-only origin/dev docs/ci/ 2>/dev/null | grep -qE '\.ya?ml$'; then
    [[ -n "$branch" ]] && echo "aes-workflow: the branch $branch no longer exists on GitHub; dev has docs/ci/: starting from dev."
    branch="spec/aes-workflow-$(date +%Y%m%d-%H%M%S)"; new_pr=1
    git push -q origin "origin/dev:refs/heads/$branch"
  else
    echo "aes-workflow: ${branch:-no branch} does not exist on GitHub and dev has no docs/ci/*.yml: nothing to apply." >&2; exit 1
  fi
fi
p=$(bash .claude/scripts/aes-wt.sh open "$branch" | tail -n1)
cleanup() { bash .claude/scripts/aes-wt.sh close "$branch" >/dev/null 2>&1 || true; }
trap cleanup EXIT
shopt -s nullglob
files=("$p"/docs/ci/*.yml "$p"/docs/ci/*.yaml)
(( ${#files[@]} > 0 )) || { echo "aes-workflow: $branch has no files in docs/ci/." >&2; exit 1; }
for f in "${files[@]}"; do
  n=$(basename "$f")
  echo "=== .github/workflows/$n ==="
  git -C "$p" diff --no-index --stat -- ".github/workflows/$n" "docs/ci/$n" 2>/dev/null || true
  git -C "$p" --no-pager diff --no-index -- ".github/workflows/$n" "docs/ci/$n" || true
done
read -r -p "Apply these changes on $branch with your identity? (y/n) [n]: " a
if [[ "$a" != [yYsS]* ]]; then
  (( new_pr )) && git push -q origin --delete "$branch" 2>/dev/null
  echo "No changes."; exit 0
fi
mkdir -p "$p/.github/workflows"
for f in "${files[@]}"; do
  n=$(basename "$f"); cp "$f" "$p/.github/workflows/$n"; git -C "$p" rm -q "docs/ci/$n"
  git -C "$p" add ".github/workflows/$n"
done
git -C "$p" commit -q -m "ci: apply the workflow prepared in docs/ci/ ($branch)"
git -C "$p" push -q origin "HEAD:$branch"
if (( new_pr )); then
  gh pr create --base dev --head "$branch" --title "ci: apply the workflow prepared in docs/ci/" \
    --body "Moves docs/ci/*.yml to .github/workflows/ (applied by the human with aes-workflow.sh)." || true
fi
echo "Published on $branch. Check the PR's CI and merge it with squash (bypass: it is your PR)."
