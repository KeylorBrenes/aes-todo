#!/usr/bin/env bash
# AES 1.3.0 — Resumen estructural para la nota de diseño (standard/10 §5).
#
# Lista los archivos versionados y sus firmas públicas (tipos, funciones exportadas), sin el
# código de las implementaciones. Es un hecho generado por herramienta: el orquestador decide el
# diseño con esto, no con la descripción que otro agente haga del código.
#
# Uso: aes-outline.sh [<ref>] [<ruta>...]      p. ej.  aes-outline.sh origin/dev src web/src
#   <ref>   commit o rama a resumir (por defecto HEAD)
#   <ruta>  directorios a incluir (por defecto, todo lo versionado salvo tests/acceptance y docs)
# Variables: AES_OUTLINE_MAX (líneas máximas de salida, por defecto 600).
#
# Lenguajes: C#, TypeScript/JavaScript, Python, bash. Para otros, el archivo aparece sin firmas.
set -euo pipefail

ref="HEAD"
if [[ $# -gt 0 ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null; then ref="$1"; shift; fi
max="${AES_OUTLINE_MAX:-600}"

if [[ $# -gt 0 ]]; then
  files=$(git ls-tree -r --name-only "$ref" -- "$@")
else
  files=$(git ls-tree -r --name-only "$ref" | grep -Ev '^(tests/acceptance/|docs/|specs/|\.github/|\.claude/)' || true)
fi
files=$(grep -Ev '(^|/)(node_modules|bin|obj|dist|build|Migrations)/|\.(lock|json|md|svg|png|jpg|ico|css)$|package-lock\.json$' <<< "$files" || true)

signatures() {  # signatures <ruta> : imprime las firmas públicas del archivo en <ref>
  local path="$1" re
  case "$path" in
    *.cs)  re='^[[:space:]]*(public|internal|protected)[[:space:]].*(class|interface|record|struct|enum|delegate)[[:space:]]+[A-Za-z_]|^[[:space:]]*public[[:space:]][^=;]*\(' ;;
    *.ts|*.tsx|*.js|*.jsx|*.mjs) re='^export[[:space:]]+(default[[:space:]]+)?(async[[:space:]]+)?(function|class|const|let|interface|type|enum)[[:space:]]' ;;
    *.py)  re='^(async[[:space:]]+)?(def|class)[[:space:]]+[A-Za-z_]' ;;
    *.sh|*.bash) re='^[[:space:]]*(function[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*[[:space:]]*\(\)[[:space:]]*\{' ;;
    *) return 0 ;;
  esac
  git show "$ref:$path" 2>/dev/null \
    | grep -nE "$re" \
    | sed -E 's/[[:space:]]*(\{|=>).*$//; s/[[:space:]]+/ /g; s/^([0-9]+): ?(.*)$/    \2  (l.\1)/'
}

{
  echo "# Resumen estructural ($ref, $(git rev-parse --short "$ref"))"
  echo
  echo "Archivos versionados y firmas públicas, sin implementaciones. Generado por aes-outline.sh."
  echo
  current_dir=""
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    dir=$(dirname "$f")
    if [[ "$dir" != "$current_dir" ]]; then echo; echo "## $dir/"; current_dir="$dir"; fi
    echo "- $(basename "$f")"
    signatures "$f"
  done <<< "$files"
} | head -n "$max"
