#!/usr/bin/env bash
# AES — Prints the protected base branch of the current branch: origin/dev or, in a hotfix,
# origin/main (standard/07 §9). It tells them apart by where the item's specification is
# published: in dev for normal work, in main for a hotfix.
# Usage: base=$(bash .claude/scripts/aes-base.sh)
set -uo pipefail
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
item=""
case "$branch" in
  task/*/*)           item=$(cut -d/ -f2 <<< "$branch") ;;
  qa/*)               item=${branch#qa/} ;;
  spec/*-close)       item=${branch#spec/}; item=${item%-close} ;;
  spec/*)             item=${branch#spec/} ;;
esac
if [[ -n "$item" ]]; then
  for base in origin/dev origin/main; do
    if git ls-tree -d --name-only "$base" "specs/$item" 2>/dev/null | grep -q .; then
      echo "$base"; exit 0
    fi
  done
fi
echo origin/dev
