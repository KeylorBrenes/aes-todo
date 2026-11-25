#!/usr/bin/env bash
# AES 1.5.0 — Binding efectivo de un rol para una tarea (standard/06 §12.1).
#
# Cada rol tiene un binding por defecto (AES_BIND_<ROL> en .claude/aes.env) y uno por nivel
# (AES_BIND_<ROL>_<NIVEL>, p. ej. AES_BIND_PROGRAMMER_ALTO). La tarea elige el nivel con su campo
# «**Nivel de modelo:**» (lo escribe el orquestador y lo aprueba el humano en el PR qa/<ID>):
#   **Nivel de modelo:** estándar                        → AES_BIND_<ROL>
#   **Nivel de modelo:** alto — <motivo>                 → AES_BIND_<ROL>_ALTO (si no existe, el estándar)
#   **Nivel de modelo:** opencode:<proveedor>/<modelo>   → ese binding, tal cual
#   **Nivel de modelo:** claude:<sonnet|opus|haiku>      → subagente de Claude Code con ese modelo
#
# Uso: aes-bind.sh <rol> [<archivo de tarea> | <rama>]
#   rol: qa, programmer, mechanic o verifier. Con una rama task/<ID>/<TASK>, lee specs/<ID>/<TASK>.md
#   del checkout actual; con otra rama o sin tarea, el binding por defecto del rol.
# Imprime el binding («claude», «claude:<modelo>» u «opencode:<proveedor>/<modelo>») y, en stderr,
# de dónde salió.
set -euo pipefail
role=${1:?Uso: aes-bind.sh <rol> [<archivo de tarea> | <rama>]}; src=${2:-}
case "$role" in qa|programmer|mechanic|verifier) ;; *) echo "aes-bind: rol desconocido: $role" >&2; exit 2 ;; esac
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
overrides=$(env | grep -E '^AES_BIND_[A-Z_]*=' || true)
# shellcheck source=/dev/null
[[ -f "$root/.claude/aes.env" ]] && source "$root/.claude/aes.env"
while IFS= read -r kv; do [[ -n "$kv" ]] && export "${kv?}"; done <<< "$overrides"

R=$(tr '[:lower:]' '[:upper:]' <<< "$role")
def="AES_BIND_$R"; default=${!def:-claude}

file=""
if [[ "$src" =~ ^task/([^/]+)/([^/]+)$ ]]; then file="specs/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}.md"
elif [[ -n "$src" && -f "$src" ]]; then file=$src; fi
# La especificación aprobada vive en origin/dev (o en la rama, si aún no se integró).
level=""
if [[ -n "$file" ]]; then
  text=$(git -C "$root" show "origin/dev:$file" 2>/dev/null || cat "$root/$file" 2>/dev/null || cat "$file" 2>/dev/null || true)
  level=$(sed -n 's/^[-*[:space:]]*\*\*Nivel de modelo:\*\*[[:space:]]*//p' <<< "$text" | head -n1 | tr -d '\r')
fi
level=${level%%[[:space:]]—*}; level=${level%%[[:space:]]-[[:space:]]*}; level=${level%% (*}
level="${level%"${level##*[![:space:]]}"}"   # sin espacios al final

case "$level" in
  ""|estándar|estandar|Estándar|Estandar)
    echo "aes-bind: $role → $default (por defecto${file:+, $file})" >&2; printf '%s\n' "$default" ;;
  opencode:*|claude|claude:*)
    echo "aes-bind: $role → $level (fijado en $file)" >&2; printf '%s\n' "$level" ;;
  *)
    N=$level; N=${N//á/a}; N=${N//é/e}; N=${N//í/i}; N=${N//ó/o}; N=${N//ú/u}
    N=${N//Á/A}; N=${N//É/E}; N=${N//Í/I}; N=${N//Ó/O}; N=${N//Ú/U}
    N=$(tr '[:lower:]' '[:upper:]' <<< "$N" | tr -c 'A-Z0-9\n' '_')
    v="AES_BIND_${R}_${N}"
    if [[ -n "${!v:-}" ]]; then echo "aes-bind: $role → ${!v} (nivel $level, $v)" >&2; printf '%s\n' "${!v}"
    else echo "aes-bind: $role → $default (nivel $level sin $v en aes.env: se usa el de por defecto)" >&2; printf '%s\n' "$default"; fi ;;
esac
