#!/usr/bin/env bash
# AES 1.3.0 — Checkouts propios por rol (standard/06 §10) con git worktree.
#
# El checkout principal se queda siempre en `dev`. Cada rama de trabajo se abre en su propio
# worktree, en .claude/worktrees/<rama con / cambiadas por ->. Una rama solo puede estar en un
# worktree a la vez (regla de git): cierra el tuyo antes de delegar en la misma rama.
#
# Uso:
#   aes-wt.sh open <rama> [<base>]   crea el worktree (y la rama desde <base>, por defecto origin/dev,
#                                    si no existe) e imprime su ruta
#   aes-wt.sh close <rama>           lo elimina si está limpio (los commits quedan en la rama)
#   aes-wt.sh path <rama>            imprime la ruta (exista o no)
#   aes-wt.sh run <rama> -- <cmd…>   abre, ejecuta <cmd> dentro y cierra
#   aes-wt.sh delegate <rama>        prepara la delegación: el próximo subagente con
#                                    `isolation: worktree` trabajará en <rama> (lo lee worktree-create.sh)
set -euo pipefail

main_root() {  # raíz del checkout principal, aunque se llame desde un worktree
  local common
  common=$(git rev-parse --path-format=absolute --git-common-dir)
  dirname "$common"
}
root=$(main_root)
wt_dir="$root/.claude/worktrees"
wt_path() { printf '%s/%s' "$wt_dir" "${1//\//-}"; }

# Archivos locales no versionados que el rol necesita (06 §10). Añade aquí los de tu proyecto.
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
    [[ -n "$branch" ]] || { echo "Uso: aes-wt.sh open <rama> [<base>]" >&2; exit 2; }
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
    [[ -n "$branch" ]] || { echo "Uso: aes-wt.sh close <rama>" >&2; exit 2; }
    path=$(wt_path "$branch")
    [[ -d "$path" ]] || exit 0
    for f in "${AES_WT_LOCAL_FILES[@]}"; do rm -f "${path:?}/$f"; done   # copias locales, en .gitignore
    if [[ -n "$(git -C "$path" status --porcelain)" ]]; then
      echo "AES: $path tiene cambios sin commit; no se elimina. Revísalos antes de cerrar." >&2
      copy_local_files "$path"; exit 1
    fi
    git -C "$root" worktree remove "$path"
    ;;
  path)
    wt_path "$branch"; echo
    ;;
  run)
    [[ -n "$branch" && "${3:-}" == "--" ]] || { echo "Uso: aes-wt.sh run <rama> -- <cmd…>" >&2; exit 2; }
    shift 3
    path=$("$0" open "$branch")
    status=0
    (cd "$path" && "$@") || status=$?
    "$0" close "$branch" || status=1
    exit $status
    ;;
  delegate)
    [[ -n "$branch" ]] || { echo "Uso: aes-wt.sh delegate <rama>" >&2; exit 2; }
    if [[ -d "$(wt_path "$branch")" ]]; then
      echo "AES: la rama $branch ya está abierta en $(wt_path "$branch"). Ciérrala (aes-wt.sh close) antes de delegar." >&2
      exit 1
    fi
    git -C "$root" show-ref --verify --quiet "refs/heads/$branch" || {
      echo "AES: la rama $branch no existe todavía. Créala con aes-wt.sh open y ciérrala, o con git branch." >&2; exit 1; }
    mkdir -p "$root/.aes"
    printf '%s\n' "$branch" > "$root/.aes/next-branch"
    echo "Delegación preparada: el próximo subagente trabajará en $branch."
    ;;
  *)
    echo "Uso: aes-wt.sh open|close|path|run|delegate <rama> …" >&2; exit 2 ;;
esac
