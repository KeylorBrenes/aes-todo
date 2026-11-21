#!/usr/bin/env bash
# AES 1.3.0 — Imprime la rama base protegida de la rama actual: origin/dev o, en un hotfix,
# origin/main (standard/07 §9). La distingue por dónde está publicada la especificación del
# elemento: en dev para el trabajo normal, en main para un hotfix.
# Uso: base=$(bash .claude/scripts/aes-base.sh)
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
