#!/usr/bin/env bash
# AES 1.5.1 — Chequeo del entorno antes de delegar (aes-cycle §0, paso 6).
#
# Comprueba de una vez todo lo que un rol necesita para trabajar en esta máquina, para pedirle al
# humano lo que falte en una sola ronda y no descubrirlo tarea a tarea:
#   1. herramientas de AES (git, jq, node, npm, gh, openssl);
#   2. identidad: token de la GitHub App y sus permisos (sin Workflows: 06 §10), o sesión de gh;
#   3. OpenCode, si algún rol va ahí: versión, opciones que usa aes-oc.sh y que cada modelo responde;
#   4. el stack: las comprobaciones de AES_DOCTOR_CHECKS en .claude/aes.env.
#
# Uso: bash .claude/scripts/aes-doctor.sh [--no-ping] [--only aes|identity|opencode|stack]
#      bash .claude/scripts/aes-doctor.sh --probe rust|dotnet|node    (una compilación mínima)
#
# AES_DOCTOR_CHECKS: una comprobación por línea, «descripción|comando». El comando se ejecuta con
# bash en la raíz del repositorio y pasa si sale con 0. «probe:<stack>» compila un proyecto mínimo
# en una carpeta temporal (detecta, p. ej., un compilador sin enlazador o sin SDK):
#   AES_DOCTOR_CHECKS="
#   Rust (cargo y enlazador)|probe:rust
#   Web (Node)|probe:node
#   Navegadores de Playwright|npx --prefix tests/acceptance playwright --version
#   "
# Salida: 0 = todo bien (puede haber avisos «!»); 1 = falta algo («✗»).
set -uo pipefail

# --- Compilaciones mínimas ------------------------------------------------------------------------
probe() {
  local t rc=0; t=$(mktemp -d)
  case "$1" in
    rust)
      command -v cargo >/dev/null || { echo "falta cargo (instala rustup)"; rm -rf "$t"; return 1; }
      (cd "$t" && cargo new --vcs none -q aesprobe && cd aesprobe && cargo build -q) || rc=$? ;;
    dotnet)
      command -v dotnet >/dev/null || { echo "falta dotnet"; rm -rf "$t"; return 1; }
      (cd "$t" && dotnet new console -o aesprobe >/dev/null && dotnet build aesprobe -nologo -v q) || rc=$? ;;
    node)
      if ! command -v node >/dev/null || ! command -v npm >/dev/null; then echo "falta node o npm"; rm -rf "$t"; return 1; fi
      (cd "$t" && npm init -y >/dev/null && node -e 'process.exit(0)') || rc=$? ;;
    *) echo "probe desconocido: $1 (rust, dotnet o node)"; rc=2 ;;
  esac
  rm -rf "$t"; return $rc
}
if [[ "${1:-}" == --probe ]]; then probe "${2:-}"; exit $?; fi

ping=1; only=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-ping) ping=0 ;;
    --only) only=${2:?}; shift ;;
    *) sed -n '2,/^set -uo/p' "$0" | sed '$d'; exit 2 ;;
  esac
  shift
done

root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)") \
  || { echo "aes-doctor: no estás dentro de un repositorio git." >&2; exit 1; }
cd "$root" || exit 1
overrides=$(env | grep -E '^(AES_BIND_|AES_OC_|AES_DOCTOR_)[A-Z_]*=' || true)
# shellcheck source=/dev/null
[[ -f .claude/aes.env ]] && source .claude/aes.env
while IFS= read -r kv; do [[ -n "$kv" ]] && export "${kv?}"; done <<< "$overrides"

fails=0; warns=0
ok()   { printf '  ✓ %s\n' "$*"; }
bad()  { printf '  ✗ %s\n' "$*"; fails=$((fails + 1)); }
warn() { printf '  ! %s\n' "$*"; warns=$((warns + 1)); }
section() { [[ -z "$only" || "$only" == "$1" ]] || return 1; printf '\n%s\n' "$2"; }

# Ejecuta un comando con límite de tiempo, sin `timeout` (macOS no lo trae). $1 segundos, $2 log.
limited() {
  local secs=$1 log=$2 t=0; shift 2
  "$@" > "$log" 2>&1 &
  local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    sleep 1; t=$((t + 1))
    if (( t >= secs )); then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 124; fi
  done
  wait "$pid"
}

# --- 1. Herramientas de AES ------------------------------------------------------------------------
if section aes "Herramientas de AES"; then
  if [[ -f .claude/agents/verifier.md && -f CLAUDE.md ]]; then ok "raíz del proyecto: $root"
  else bad "esta carpeta no tiene .claude/agents ni CLAUDE.md: abre Claude Code dentro del proyecto"; fi
  ok "bash ${BASH_VERSION%%(*}"
  for c in git jq node npm gh openssl; do
    if command -v "$c" >/dev/null; then ok "$c"; else bad "falta $c en el PATH"; fi
  done
  if command -v node >/dev/null && node .claude/scripts/aes-board.mjs --check-hook >/dev/null 2>&1; then
    ok "tablero del backlog: se regenera solo tras cada pull (.aes/board.html)"
  else
    warn "el tablero no se regenera solo en esta máquina (los hooks de git no se versionan): node .claude/scripts/aes-board.mjs --install-hook"
  fi
fi

# --- 2. Identidad ----------------------------------------------------------------------------------
if section identity "Identidad (${AES_IDENTITY:-app})"; then
  if [[ "${AES_IDENTITY:-app}" == personal ]]; then
    if gh auth status >/dev/null 2>&1; then ok "sesión de gh activa (modo personal)"; else bad "gh auth status falla: gh auth login"; fi
  elif tok=$(bash .claude/scripts/gh-app-token.sh 2>&1) && [[ "$tok" == ghs_* ]]; then
    ok "token de la GitHub App"
    perms=$(bash .claude/scripts/gh-app-token.sh --permissions 2>/dev/null || echo '{}')
    for p in contents pull_requests; do
      v=$(jq -r --arg p "$p" '.[$p] // "none"' <<< "$perms")
      if [[ "$v" == write ]]; then ok "app: $p = write"; else bad "app: $p = $v (hace falta write; ajústalo en la app y acepta el cambio en la instalación)"; fi
    done
    if [[ "$(jq -r '.workflows // "none"' <<< "$perms")" != none ]]; then
      warn "app: tiene permiso de workflows. AES lo deja en «No access» para que los agentes no puedan cambiar la CI que los juzga (06 §10); los cambios de workflow los aplicas tú con .claude/scripts/aes-workflow.sh"
    else ok "app: sin permiso de workflows (como pide AES)"; fi
  else
    bad "no hay token de la app: $tok"
  fi
fi

# --- 3. OpenCode -----------------------------------------------------------------------------------
models=()
# Todos los bindings: los de cada rol y los de cada nivel de modelo (AES_BIND_<ROL>_<NIVEL>).
for v in $(compgen -v AES_BIND_); do
  b=${!v}
  case "$b" in
    claude|claude:sonnet|claude:opus|claude:haiku|opencode:*/*) ;;
    *) bad "$v=\"$b\" no es un binding válido (claude, claude:<sonnet|opus|haiku> u opencode:<proveedor>/<modelo>)" ;;
  esac
  if [[ "$b" == opencode:* ]]; then
    m=${b#opencode:}; seen=0
    for x in "${models[@]:-}"; do [[ "$x" == "$m" ]] && seen=1; done
    (( seen )) || models+=("$m")
  fi
done
if (( ${#models[@]} > 0 )) && section opencode "OpenCode (${models[*]})"; then
  if ! command -v opencode >/dev/null; then
    bad "falta opencode en el PATH"
  else
    ver=$(opencode --version 2>/dev/null | tr -d '\r' || echo '?')
    if [[ " ${AES_OC_TESTED:-} " == *" $ver "* ]]; then ok "opencode $ver (probada con AES)"
    else warn "opencode $ver no está entre las versiones probadas (${AES_OC_TESTED:-sin dato}); se comprueban sus opciones"; fi
    help=$(opencode run --help 2>&1 || true); missing=""
    for flag in --agent --model --format --session --title; do grep -q -- "$flag" <<< "$help" || missing+=" $flag"; done
    if [[ -z "$missing" ]]; then ok "opencode run acepta las opciones de aes-oc.sh"; else bad "opencode run no acepta:$missing (aes-oc.sh no funcionará)"; fi
    for m in "${models[@]}"; do
      [[ "$m" == *-free ]] && warn "$m es gratuito: el plan corta las sesiones largas por límite de uso (429). Úsalo solo para probar"
      (( ping )) || continue
      log=$(mktemp)
      if limited 240 "$log" opencode run -m "$m" --format json "Responde solo: OK" \
         && jq -cR 'fromjson? | objects' "$log" 2>/dev/null | jq -se 'any(.[]; .type == "text") and (any(.[]; .type == "error") | not)' >/dev/null; then
        ok "$m responde"
      else
        msg=$(jq -cR 'fromjson? | objects | select(.type == "error") | (.error.data.message // .error.name)' "$log" 2>/dev/null | tr -d '"' | tail -n 1)
        bad "$m no responde: ${msg:-$(tail -n 2 "$log" | tr '\n' ' ')} (clave, saldo o conexión: opencode auth list)"
      fi
      rm -f "$log"
    done
  fi
fi

# --- 4. Stack --------------------------------------------------------------------------------------
if section stack "Stack del proyecto (AES_DOCTOR_CHECKS)"; then
  n=0
  while IFS= read -r line; do
    line=${line%$'\r'}; [[ -z "${line// /}" || "$line" == \#* ]] && continue
    desc=${line%%|*}; cmd=${line#*|}; n=$((n + 1)); log=$(mktemp)
    if [[ "$cmd" == probe:* ]]; then probe "${cmd#probe:}" > "$log" 2>&1; rc=$?
    else bash -c "$cmd" > "$log" 2>&1; rc=$?; fi
    if (( rc == 0 )); then ok "$desc"; else bad "$desc: $(tail -n 3 "$log" | tr '\n' ' ')"; fi
    rm -f "$log"
  done <<< "${AES_DOCTOR_CHECKS:-}"
  (( n > 0 )) || warn "AES_DOCTOR_CHECKS está vacío: sin comprobaciones del stack. Si ya hay ADR del stack, el orquestador las propone (incluida una compilación mínima)"
fi

echo
if (( fails > 0 )); then echo "Faltan $fails cosas (✗). Resuélvelas todas antes de delegar."; exit 1; fi
if (( warns > 0 )); then echo "Entorno listo ($warns avisos «!»)."; else echo "Entorno listo."; fi
