#!/usr/bin/env bash
# AES 1.2.0 — Ejecuta comandos de verificación (standard/05 §12), capa L3.
#
# Un comando de verificación es un script bash versionado en specs/<ID>/<nombre>.verify que
# termina con 0 si el criterio se cumple. Se trata como una prueba protegida.
#
# Uso: run-verify.sh red|green <ref> <ruta.verify>...
#   green  cada comando debe PASAR. Se ejecuta la copia de <ref> (la base protegida).
#   red    cada comando debe FALLAR contra el código actual (RED). Se ejecuta la copia de <ref>
#          (la rama que lo propone). Un comando que declara «# aes: no-red <motivo>» en sus
#          primeras 5 líneas se exime, y el motivo se imprime para la revisión humana.
#
# Variables: AES_VERIFY_TIMEOUT (segundos por comando, por defecto 300).
# Cada comando se ejecuta desde la raíz del repo, con el código de la rama actual.
set -uo pipefail

mode="${1:-}"; ref="${2:-}"; shift 2 || true
case "$mode" in red|green) ;; *) echo "Uso: run-verify.sh red|green <ref> <ruta.verify>..." >&2; exit 2 ;; esac
[[ $# -gt 0 ]] || { echo "AES verify: no hay comandos de verificación que ejecutar."; exit 0; }

root=$(git rev-parse --show-toplevel); cd "$root" || exit 2
timeout_s="${AES_VERIFY_TIMEOUT:-300}"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
fail=0

for path in "$@"; do
  copy="$tmp/$(tr '/' '_' <<< "$path")"
  if ! git show "$ref:$path" > "$copy" 2>/dev/null; then
    echo "FAIL [verify] No existe $path en $ref."; fail=1; continue
  fi
  if [[ "$mode" == "red" ]]; then
    reason=$(head -n 5 "$copy" | sed -n 's/^#[[:space:]]*aes:[[:space:]]*no-red[[:space:]]*//p' | head -n1)
    if [[ -n "$reason" ]]; then
      echo "INFO [verify] $path se declara sin RED: $reason  (requiere aprobación humana explícita)"
      continue
    fi
  fi
  echo "── $path ($mode)"
  timeout "$timeout_s" bash "$copy" > "$tmp/out" 2>&1
  status=$?
  sed 's/^/   │ /' "$tmp/out" | tail -n 40
  if [[ "$mode" == "green" && $status -ne 0 ]]; then
    echo "FAIL [verify] $path debía pasar y terminó con código $status."; fail=1
  elif [[ "$mode" == "red" && $status -eq 0 ]]; then
    echo "FAIL [verify] $path PASA contra el código actual: no demuestra el defecto ni la ausencia del cambio (RED)."; fail=1
  elif [[ "$mode" == "red" && $status -eq 124 ]]; then
    echo "FAIL [verify] $path superó el tiempo límite: un timeout no es RED."; fail=1
  else
    echo "OK   [verify] $path (código $status)"
  fi
done
(( fail == 0 )) && echo "AES verify ($mode): OK"
exit $fail
