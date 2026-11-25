#!/usr/bin/env bash
# AES 1.4.1 — Aplica un cambio de workflow preparado por el orquestador. Lo ejecuta EL HUMANO.
#
# La identidad de los agentes no tiene permiso de Workflows (06 §10): así ningún agente puede cambiar
# la CI que lo juzga. Cuando un elemento necesita cambiar .github/workflows/, el orquestador deja el
# archivo nuevo en docs/ci/<nombre>.yml de una rama (normalmente spec/<ID>-ci) y te pide ejecutar esto
# en tu terminal, con tu propia sesión de git (no con la app):
#
#   bash .claude/scripts/aes-workflow.sh <rama>
#
# Muestra el diff, pide confirmación, mueve docs/ci/*.yml a .github/workflows/ en esa rama, hace el
# commit con tu identidad y la publica. Después, la CI del PR ya corre con el workflow nuevo.
set -euo pipefail
branch=${1:?Uso: aes-workflow.sh <rama>}
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
cd "$root"
[[ -z "${CLAUDECODE:-}${AES_ROLE:-}" ]] || { echo "aes-workflow: lo ejecuta el humano, no un agente." >&2; exit 2; }
git fetch -q origin "$branch"
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
[[ "$a" == [sS]* ]] || { echo "Sin cambios."; exit 0; }
mkdir -p "$p/.github/workflows"
for f in "${files[@]}"; do
  n=$(basename "$f"); cp "$f" "$p/.github/workflows/$n"; git -C "$p" rm -q "docs/ci/$n"
  git -C "$p" add ".github/workflows/$n"
done
git -C "$p" commit -q -m "ci: aplicar el workflow preparado en docs/ci/ ($branch)"
git -C "$p" push -q origin "HEAD:$branch"
echo "Publicado en $branch. Revisa la CI del PR."
