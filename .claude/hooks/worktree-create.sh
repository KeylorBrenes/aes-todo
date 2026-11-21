#!/usr/bin/env bash
# AES 1.3.0 — WorktreeCreate: el subagente trabaja en la rama de trabajo real, no en una rama
# temporal (standard/06 §10). Sustituye la lógica por defecto de Claude Code.
#
# El orquestador indica la rama antes de delegar:  bash .claude/scripts/aes-wt.sh delegate <rama>
# Este hook la lee de .aes/next-branch (un solo uso), abre el worktree con aes-wt.sh, que copia
# los archivos locales que el rol necesita, y deja la ruta en .aes/active-worktree para
# subagent-gate.sh. En stdout imprime solo la ruta, que es lo que Claude Code espera.
#
# Falla cerrado: sin rama indicada no crea nada, y el subagente no arranca.
set -uo pipefail

input=$(cat)
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")
[[ -n "$root" && -d "$root" ]] || { echo "AES worktree-create: no se encontró el repositorio." >&2; exit 1; }

next="$root/.aes/next-branch"
if [[ ! -s "$next" ]]; then
  name=$(jq -r '.worktree_name // .name // empty' <<< "$input" 2>/dev/null)
  echo "AES worktree-create: no hay rama indicada para el worktree '${name:-?}'. El orquestador debe ejecutar 'aes-wt.sh delegate <rama>' antes de delegar." >&2
  exit 1
fi
branch=$(tr -d '\r\n' < "$next")
rm -f "$next"

if ! path=$(bash "$root/.claude/scripts/aes-wt.sh" open "$branch"); then
  echo "AES worktree-create: no se pudo abrir el worktree de $branch." >&2
  exit 1
fi
printf '%s\n' "$path" > "$root/.aes/active-worktree"
printf '%s\n' "$path"
