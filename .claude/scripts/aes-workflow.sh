#!/usr/bin/env bash
# AES 1.5.2 — Aplica un cambio de workflow preparado por el orquestador. Lo ejecuta EL HUMANO.
#
# La identidad de los agentes no tiene permiso de Workflows (06 §10): así ningún agente puede cambiar
# la CI que lo juzga. Cuando un elemento necesita cambiar .github/workflows/, el orquestador deja el
# archivo nuevo en docs/ci/<nombre>.yml de una rama (normalmente spec/<ID>-ci) y te pide ejecutar esto
# en tu terminal, con tu propia sesión de git (no con la app):
#
#   bash .claude/scripts/aes-workflow.sh <rama>
#   bash .claude/scripts/aes-workflow.sh            (sin rama: si dev tiene docs/ci/*.yml, crea una rama
#                                                    spec/aes-workflow-<fecha> desde dev y abre el PR)
#
# Muestra el diff, pide confirmación, mueve docs/ci/*.yml a .github/workflows/ en esa rama, hace el
# commit con tu identidad y la publica. Después, la CI del PR ya corre con el workflow nuevo.
set -euo pipefail
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
cd "$root"
[[ -z "${CLAUDECODE:-}${AES_ROLE:-}" ]] || { echo "aes-workflow: lo ejecuta el humano, no un agente." >&2; exit 2; }
git fetch -q origin
branch=${1:-}; new_pr=0
if [[ -z "$branch" ]] || ! git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
  # La rama ya se integró (y GitHub la borró) o no se indicó: si dev trae docs/ci/, se parte de dev.
  if git ls-tree --name-only origin/dev docs/ci/ 2>/dev/null | grep -qE '\.ya?ml$'; then
    [[ -n "$branch" ]] && echo "aes-workflow: la rama $branch ya no existe en GitHub; dev tiene docs/ci/: parto de dev."
    branch="spec/aes-workflow-$(date +%Y%m%d-%H%M%S)"; new_pr=1
    git push -q origin "origin/dev:refs/heads/$branch"
  else
    echo "aes-workflow: ${branch:-sin rama} no existe en GitHub y dev no tiene docs/ci/*.yml: no hay nada que aplicar." >&2; exit 1
  fi
fi
p=$(bash .claude/scripts/aes-wt.sh open "$branch" | tail -n1)
cleanup() { bash .claude/scripts/aes-wt.sh close "$branch" >/dev/null 2>&1 || true; }
trap cleanup EXIT
shopt -s nullglob
files=("$p"/docs/ci/*.yml "$p"/docs/ci/*.yaml)
(( ${#files[@]} > 0 )) || { echo "aes-workflow: $branch no tiene archivos en docs/ci/." >&2; exit 1; }
for f in "${files[@]}"; do
  n=$(basename "$f")
  echo "=== .github/workflows/$n ==="
  git -C "$p" diff --no-index --stat -- ".github/workflows/$n" "docs/ci/$n" 2>/dev/null || true
  git -C "$p" --no-pager diff --no-index -- ".github/workflows/$n" "docs/ci/$n" || true
done
read -r -p "¿Aplico estos cambios en $branch con tu identidad? (s/n) [n]: " a
if [[ "$a" != [sS]* ]]; then
  (( new_pr )) && git push -q origin --delete "$branch" 2>/dev/null
  echo "Sin cambios."; exit 0
fi
mkdir -p "$p/.github/workflows"
for f in "${files[@]}"; do
  n=$(basename "$f"); cp "$f" "$p/.github/workflows/$n"; git -C "$p" rm -q "docs/ci/$n"
  git -C "$p" add ".github/workflows/$n"
done
git -C "$p" commit -q -m "ci: aplicar el workflow preparado en docs/ci/ ($branch)"
git -C "$p" push -q origin "HEAD:$branch"
if (( new_pr )); then
  gh pr create --base dev --head "$branch" --title "ci: aplicar el workflow preparado en docs/ci/" \
    --body "Mueve docs/ci/*.yml a .github/workflows/ (lo aplicó el humano con aes-workflow.sh)." || true
fi
echo "Publicado en $branch. Revisa la CI del PR e intégralo con squash (bypass: es tu PR)."
