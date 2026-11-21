#!/usr/bin/env bash
# AES — Arranca la API (y opcionalmente la web), ejecuta un comando y SIEMPRE detiene lo que arrancó.
#
# Para la prueba manual agéntica del verificador y cualquier rol que necesite servidores
# (FL-007: procesos que sobreviven al rol y contaminan la evidencia del siguiente).
#   - No reutiliza servidores: si un puerto ya está ocupado, falla.
#   - Usa una base SQLite temporal propia.
#   - Al terminar (bien, mal o con Ctrl+C) detiene el árbol de procesos que arrancó, y solo ese.
#
# Uso:
#   bash .claude/scripts/with-servers.sh [--web] -- <comando> [args...]
# Ejemplos:
#   bash .claude/scripts/with-servers.sh -- curl -s http://localhost:5080/api/categories
#   bash .claude/scripts/with-servers.sh --web -- node "$TEMP/manual-check.mjs"
#
# Configuración: .claude/aes.env (AES_API_CMD, AES_API_HEALTH, AES_WEB_CMD, AES_WEB_URL,
# AES_DB_VAR, AES_DB_VALUE). Las variables de entorno ya definidas tienen prioridad.
#   AES_WAIT_SECONDS            (por defecto 120)
#
# No sirve para la aceptación con Playwright: su configuración arranca sus propios servidores en
# los mismos puertos. Es la herramienta de la prueba manual del verificador.
set -uo pipefail

with_web=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --web) with_web=1; shift ;;
    --) shift; break ;;
    *) echo "Uso: with-servers.sh [--web] -- <comando> [args...]" >&2; exit 2 ;;
  esac
done
[[ $# -gt 0 ]] || { echo "Falta el comando a ejecutar después de --" >&2; exit 2; }

root=$(git rev-parse --show-toplevel)
cd "$root" || exit 2
tmp=$(mktemp -d)
is_windows=0
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) is_windows=1 ;; esac

# Configuración del proyecto (sin pisar lo que ya venga en el entorno).
if [[ -f "$root/.claude/aes.env" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^AES_[A-Z_]+$ ]] || continue
    [[ -n "${!key:-}" ]] && continue
    value="${value%\"}"; value="${value#\"}"
    export "$key=$value"
  done < <(grep -E '^AES_[A-Z_]+=' "$root/.claude/aes.env" | tr -d '\r')
fi

db="$tmp/manual.db"
[[ $is_windows == 1 ]] && command -v cygpath >/dev/null && db=$(cygpath -m "$db")
api_cmd="${AES_API_CMD:?Falta AES_API_CMD en .claude/aes.env}"
api_health="${AES_API_HEALTH:?Falta AES_API_HEALTH en .claude/aes.env}"
web_cmd="${AES_WEB_CMD:-}"
web_url="${AES_WEB_URL:-}"
db_var="${AES_DB_VAR:-}"
db_value="${AES_DB_VALUE:-}"; db_value="${db_value//\{db\}/$db}"
wait_s="${AES_WAIT_SECONDS:-120}"
if [[ $with_web == 1 && ( -z "$web_cmd" || -z "$web_url" ) ]]; then
  echo "Falta AES_WEB_CMD o AES_WEB_URL en .claude/aes.env" >&2; exit 2
fi

pids=()
# shellcheck disable=SC2329  # se invoca desde trap EXIT
stop_all() {
  local pid winpid
  for pid in "${pids[@]}"; do
    if [[ $is_windows == 1 ]]; then
      # dotnet run / npm crean procesos hijos nativos: hay que detener el árbol completo.
      winpid=$(cat "/proc/$pid/winpid" 2>/dev/null || true)
      [[ -n "$winpid" ]] && taskkill //PID "$winpid" //T //F >/dev/null 2>&1
      kill "$pid" 2>/dev/null
    else
      # Cada servidor arrancó en su propio grupo de procesos (setsid): se detiene el grupo.
      kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
      sleep 1
      kill -KILL -- "-$pid" 2>/dev/null || true
    fi
  done
  rm -rf "$tmp"
}
trap stop_all EXIT
trap 'exit 130' INT TERM

up() { curl -s -o /dev/null --max-time 2 "$1"; }

start() {  # start <nombre> <comando> <url>
  local name="$1" cmd="$2" url="$3" log="$tmp/$1.log" i
  if up "$url"; then
    echo "AES: $url ya responde. Hay un servidor vivo de otro rol o de una sesión anterior; no se reutiliza (FL-007). Detenlo y vuelve a intentar." >&2
    exit 3
  fi
  local envs=()
  [[ -n "$db_var" ]] && envs=("$db_var=$db_value")
  if [[ $is_windows == 1 ]]; then
    env "${envs[@]}" bash -c "$cmd" >"$log" 2>&1 &
  else
    env "${envs[@]}" setsid bash -c "$cmd" >"$log" 2>&1 &
  fi
  pids+=("$!")
  for ((i = 0; i < wait_s; i++)); do
    up "$url" && { echo "AES: $name lista en $url"; return 0; }
    kill -0 "${pids[${#pids[@]}-1]}" 2>/dev/null || break
    sleep 1
  done
  echo "AES: $name no arrancó. Últimas líneas de su salida:" >&2
  tail -n 30 "$log" >&2
  exit 4
}

start api "$api_cmd" "$api_health"
[[ $with_web == 1 ]] && start web "$web_cmd" "$web_url"

"$@"
status=$?
echo "AES: comando terminado (código $status); deteniendo servidores."
exit "$status"
