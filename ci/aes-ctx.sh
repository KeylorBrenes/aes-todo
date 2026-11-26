#!/usr/bin/env bash
# AES — CI context: what kind of branch it is and what must run (standard/05 §12).
#
# The logic lives here and not in the workflow so it can be tested locally. The workflow runs
# the copy from the protected branch (base), like the guard.
#
# Input variables:
#   EVENT        pull_request | push
#   HEAD_BRANCH  the PR's branch (empty on push)
#   TARGET       the PR's target branch (dev | main) or the pushed branch
#   BASE         protected ref to compare with (e.g. origin/dev); on push, HEAD
#
# It prints key=value lines (for $GITHUB_OUTPUT):
#   kind     task | qa | spec | close | release | backmerge | other | push
#   target   dev | main
#   route_error  empty if the branch → target combination is valid (standard/07 §7–9)
#   item     the item's ID (US-002, BUG-004, ST-001...) or empty
#   task     the task's ID (only kind=task)
#   wanted   Playwright tags of the item in progress, without @, separated by |
#   active   closed items in regression (specs/active-stories.txt in the base), separated by |
#   verify_green  verification commands that must PASS (paths in the base), space-separated
#   verify_red    this branch's new verification commands that must FAIL (paths in the branch)
set -euo pipefail

EVENT="${EVENT:-push}"
HEAD_BRANCH="${HEAD_BRANCH:-}"
BASE="${BASE:-HEAD}"

TARGET="${TARGET:-dev}"
kind=push; item=""; task=""; route_error=""
if [[ "$EVENT" == "pull_request" ]]; then
  case "$HEAD_BRANCH" in
    task/*/*)     kind=task; item=$(cut -d/ -f2 <<< "$HEAD_BRANCH"); task=$(cut -d/ -f3 <<< "$HEAD_BRANCH") ;;
    qa/*)         kind=qa;   item=${HEAD_BRANCH#qa/} ;;
    spec/*-close) kind=close; item=${HEAD_BRANCH#spec/}; item=${item%-close} ;;
    spec/*)       kind=spec; item=${HEAD_BRANCH#spec/} ;;
    dev)          kind=release ;;
    main)         kind=backmerge ;;
    *)            kind=other ;;
  esac
  # Valid routes: only releases (dev → main) and hotfixes (work branches of a BUG-NNN) go to main.
  # Everything else and the back-merges (main → dev) go to dev.
  case "$TARGET" in
    main)
      if [[ "$kind" == "release" ]]; then :
      elif [[ "$kind" =~ ^(task|qa|spec|close)$ && "$item" =~ ^BUG-[0-9]+$ ]]; then :
      else route_error="Only releases (a PR from dev) and hotfixes (work branches of a BUG-NNN, standard/07 §9) reach main. This branch ($HEAD_BRANCH) goes to dev."
      fi ;;
    dev)
      if [[ "$kind" == "release" ]]; then route_error="dev cannot be the branch of a PR into dev."
      fi ;;
    *) route_error="Unexpected target $TARGET: PRs go to dev or main." ;;
  esac
fi

clean_list() { sed 's/#.*//' | tr -d ' \r' | { grep -v '^$' || true; }; }

# In a release or a back-merge, the regression is the result's (HEAD = the PR's merge): both
# branches are protected and the list of items travels with them (standard/05 §12).
REG_REF="$BASE"
[[ "$kind" == "release" || "$kind" == "backmerge" ]] && REG_REF=HEAD

# Closed items (regression).
active=$( { git show "$REG_REF:specs/active-stories.txt" 2>/dev/null || true; } | clean_list | paste -sd'|')

# The task's criteria, read from the base (like the surface). With no file: the whole item.
# With "none" (2.1, 04 §3): a single-layer task that only turns technical tests green; acceptance
# runs only the regression.
wanted=""; criteria=""; no_criteria=0
if [[ -n "$item" && ( "$kind" == "task" || "$kind" == "close" ) ]]; then
  wanted="$item"
  if [[ "$kind" == "task" ]]; then
    raw_criteria=$( { git show "$BASE:specs/$item/$task.criteria" 2>/dev/null || true; } | clean_list)
    if grep -qix 'none' <<< "$raw_criteria"; then no_criteria=1; wanted=""; fi
    criteria=$( { grep -E '^(AC-[0-9]+|BUG-[0-9]+)$' <<< "$raw_criteria" || true; })
    if [[ $no_criteria -eq 0 && -n "$criteria" ]]; then
      # AC-NN → <item>-AC-NN ; BUG-NNN → BUG-NNN (the defect's own tag)
      wanted=$(sed -E "s/^(AC-[0-9]+)$/$item-\1/" <<< "$criteria" | paste -sd'|')
    fi
  fi
fi

# Verification commands (specs/<ID>/*.verify).
list_verify() {  # list_verify <ref> <item>
  git ls-tree -r --name-only "$1" -- "specs/$2/" 2>/dev/null | { grep -E '\.verify$' || true; }
}
verify_green=""; verify_red=""
# Regression: those of every closed item (in tasks, close and main).
if [[ "$kind" != "qa" && "$kind" != "spec" ]]; then
  while IFS= read -r a; do
    [[ -z "$a" ]] && continue
    verify_green+=" $(list_verify "$REG_REF" "$a" | paste -sd' ')"
  done <<< "$(tr '|' '\n' <<< "$active")"
fi
# The item in progress.
if [[ -n "$item" ]]; then
  case "$kind" in
    task)
      if [[ $no_criteria -eq 1 ]]; then
        :   # technical tests only: the item's verification commands run at its last task and close
      elif [[ -n "$criteria" ]]; then
        while IFS= read -r c; do
          # BUG-NNN.verify; for an acceptance criterion, <ID>-AC-NN.verify or AC-NN.verify.
          for v in "$c" "$item-$c"; do
            git cat-file -e "$BASE:specs/$item/$v.verify" 2>/dev/null && verify_green+=" specs/$item/$v.verify"
          done
        done <<< "$criteria"
        git cat-file -e "$BASE:specs/$item/$item.verify" 2>/dev/null && verify_green+=" specs/$item/$item.verify"
      else
        verify_green+=" $(list_verify "$BASE" "$item" | paste -sd' ')"
      fi
      ;;
    close)
      verify_green+=" $(list_verify "$BASE" "$item" | paste -sd' ')"
      ;;
    qa|spec)
      # RED: only the commands this branch adds or changes.
      verify_red=$(git diff --name-only --diff-filter=AM "$BASE"...HEAD -- "specs/$item/" 2>/dev/null \
        | { grep -E '\.verify$' || true; } | paste -sd' ')
      ;;
  esac
fi
verify_green=$(tr ' ' '\n' <<< "$verify_green" | { grep -v '^$' || true; } | sort -u | paste -sd' ')

echo "kind=$kind"
echo "target=$TARGET"
echo "route_error=$route_error"
echo "reg_ref=$REG_REF"
echo "item=$item"
echo "task=$task"
echo "wanted=$wanted"
echo "active=$active"
echo "verify_green=$verify_green"
echo "verify_red=$verify_red"
