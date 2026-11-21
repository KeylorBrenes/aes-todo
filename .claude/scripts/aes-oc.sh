#!/usr/bin/env bash
# AES 1.4.0 — Delegación de un rol a OpenCode (standard/06 §12: binding de roles).
#
# El orquestador (Claude Code) delega aquí los roles cuyo binding en .claude/aes.env empieza por
# "opencode:" (p. ej. AES_BIND_PROGRAMMER="opencode:deepseek/deepseek-flash"). Hace lo mismo que el
# ciclo de un subagente de Claude Code:
#   1. abre el worktree de la rama (aes-wt.sh) y lo marca como activo;
#   2. ejecuta `opencode run --agent <rol>` ahí, sin credenciales de GitHub ni de la app en el entorno;
#      L1 = permisos de opencode.json, L2 = .opencode/plugin/aes-guard.js (los mismos hooks);
#   3. aplica la compuerta de fin de rol (.claude/hooks/subagent-gate.sh). Si falla, reanuda la sesión
#      UNA vez con el motivo, igual que un hook SubagentStop;
#   4. registra eventos, tokens y costo en .aes/runs/ y .aes/costs.csv;
#   5. imprime el reporte final del rol, el estado y el costo, y cierra el worktree si quedó limpio.
#
# Uso:
#   aes-oc.sh run <rol> <rama> [--model <proveedor/modelo>] [--] [instrucciones adicionales…]
#   aes-oc.sh report [<ID>]        costo acumulado por elemento y rol (de .aes/costs.csv)
#   aes-oc.sh binding <rol>        imprime el binding del rol
#
# Ejemplos:
#   aes-oc.sh run programmer task/US-001/TASK-001
#   aes-oc.sh run qa qa/US-001 -- "Solo los criterios AC-01 a AC-03."
#
# Es largo: el orquestador lo lanza en segundo plano y espera la notificación.
# Salida: 0 = el rol terminó y pasó la compuerta; 3 = terminó con la compuerta en rojo o BLOCKED;
#         4 = OpenCode falló (proveedor, red, saldo); 2 = uso incorrecto.
set -euo pipefail

main_root() { dirname "$(git rev-parse --path-format=absolute --git-common-dir)"; }
root=$(main_root)
cd "$root"
# .claude/aes.env da los valores del proyecto; las variables AES_BIND_* y AES_OC_* que ya estén en el
# entorno tienen prioridad (p. ej. AES_BIND_PROGRAMMER=opencode:otro/modelo para una corrida).
overrides=$(env | grep -E '^(AES_BIND_|AES_OC_)[A-Z_]*=' || true)
# shellcheck source=/dev/null
[[ -f .claude/aes.env ]] && source .claude/aes.env
while IFS= read -r kv; do [[ -n "$kv" ]] && export "${kv?}"; done <<< "$overrides"

die() { echo "aes-oc: $*" >&2; exit 2; }
upper() { tr '[:lower:]' '[:upper:]' <<< "$1"; }
binding() { local v; v="AES_BIND_$(upper "$1")"; printf '%s' "${!v:-}"; }

# --- Costo ---------------------------------------------------------------------------------------
# Precio de lista en USD por millón (entrada sin caché, salida, entrada en caché) y franjas caras en
# UTC (lunes a viernes) en las que el precio se duplica. Sirven para estimar el costo real aunque el
# modelo sea gratuito o OpenCode solo conozca el precio barato. Vacío = se usa el costo de OpenCode.
list_price=${AES_OC_LIST_PRICE:-}
peak_utc=${AES_OC_PEAK_UTC:-}

summarize() { # $1.. archivos de eventos → "pasos entrada salida razonamiento cache costo_oc costo_est"
  jq -rs --arg price "$list_price" --arg peak "$peak_utc" '
    def ranges: ($peak | split(" ") | map(select(length > 0) | split("-") | map(tonumber)));
    def is_peak($ts): ($ts / 1000 | gmtime) as $t
      | ($t[6] >= 1 and $t[6] <= 5) and any(ranges[]; $t[3] >= .[0] and $t[3] < .[1]);
    ($price | split(" ") | map(select(length > 0) | tonumber)) as $p
    | [ .[] | select(.type == "step_finish") ] as $steps
    | [ $steps[] | .part.tokens as $k
        | { i: ($k.input // 0), o: ($k.output // 0), r: ($k.reasoning // 0), c: ($k.cache.read // 0),
            oc: (.part.cost // 0),
            f: (if (.timestamp != null) and is_peak(.timestamp) then 2 else 1 end) } ] as $rows
    | [ ($rows | length),
        ($rows | map(.i) | add // 0), ($rows | map(.o) | add // 0), ($rows | map(.r) | add // 0),
        ($rows | map(.c) | add // 0), ($rows | map(.oc) | add // 0),
        (if ($p | length) == 3
           then ($rows | map((.i * $p[0] + (.o + .r) * $p[1] + .c * $p[2]) / 1000000 * .f) | add // 0)
           else ($rows | map(.oc) | add // 0) end) ]
    | map(tostring) | join(" ")' "$@"
}

report() {
  local csv=.aes/costs.csv id=${1:-}
  [[ -f "$csv" ]] || { echo "Sin registros todavía (.aes/costs.csv)."; return 0; }
  awk -F, -v id="$id" 'NR > 1 && (id == "" || $2 == id) {
      k = $2 " " $4; n[k]++; t[k] += $13; tok[k] += $8 + $9 + $10 + $11; tot += $13 }
    END {
      printf "%-12s %-11s %6s %14s %12s\n", "Elemento", "Rol", "Runs", "Tokens", "USD (est.)"
      for (k in n) { split(k, a, " "); printf "%-12s %-11s %6d %14d %12.4f\n", a[1], a[2], n[k], tok[k], t[k] }
      printf "%-12s %-11s %6s %14s %12.4f\n", "TOTAL", "", "", "", tot }' "$csv"
}

# --- Comandos ------------------------------------------------------------------------------------
cmd=${1:-}; shift || true
case "$cmd" in
  report)  report "${1:-}"; exit 0 ;;
  binding) [[ -n "${1:-}" ]] || die "uso: aes-oc.sh binding <rol>"; binding "$1"; echo; exit 0 ;;
  run)     ;;
  *)       sed -n '2,27p' "$0"; exit 2 ;;
esac

role=${1:-}; branch=${2:-}; shift 2 || die "uso: aes-oc.sh run <rol> <rama> [--model m] [--] [instrucciones]"
case "$role" in programmer|mechanic|qa) ;; *) die "rol no delegable a OpenCode: '$role' (programmer, mechanic o qa)" ;; esac
model=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --model) model=${2:?}; shift 2 ;;
    --) shift; break ;;
    *) break ;;
  esac
done
extra="$*"
if [[ -z "$model" ]]; then
  b=$(binding "$role")
  [[ "$b" == opencode:* ]] || die "el binding de '$role' es '${b:-vacío}', no OpenCode (AES_BIND_$(upper "$role") en .claude/aes.env)."
  model=${b#opencode:}
fi
command -v opencode >/dev/null || die "falta opencode en el PATH."
command -v jq >/dev/null || die "falta jq en el PATH."

# Elemento y tarea, desde la rama.
if [[ "$branch" =~ ^task/([^/]+)/([^/]+)$ ]]; then item=${BASH_REMATCH[1]}; task="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
elif [[ "$branch" =~ ^qa/([^/]+)$ ]]; then item=${BASH_REMATCH[1]}; task=$item
elif [[ "$branch" =~ ^spec/([^/]+)-close$ ]]; then item=${BASH_REMATCH[1]}; task="$item (cierre)"
else die "rama no reconocida: '$branch' (task/<ID>/<TASK>, qa/<ID> o spec/<ID>-close)"; fi

wt=$(bash .claude/scripts/aes-wt.sh open "$branch" | tail -n1)
[[ -d "$wt" ]] || die "no se pudo abrir el worktree de $branch"
mkdir -p .aes; printf '%s\n' "$wt" > .aes/active-worktree
stamp=$(date -u +%Y%m%dT%H%M%SZ)
runs=".aes/runs/${branch//\//-}"; mkdir -p "$runs"
ev1="$runs/$stamp.jsonl"; ev2="$runs/$stamp.retry.jsonl"; gatelog="$runs/$stamp.gate.log"
cleanup() { rm -f "$root/.aes/active-worktree"; }
trap cleanup EXIT

prompt="Eres el rol $role de AES. Elemento: $task. Ya estás en tu propio checkout de la rama $branch: no cambies de rama, no publiques y no abras PR (lo hace el orquestador).
Sigue tu contrato (está en tus instrucciones) y lee los archivos de specs/$item/ que indica. Termina con tu reporte final en el formato del contrato, empezando por el estado propuesto."
[[ -n "$extra" ]] && prompt+=$'\n\nInstrucciones del orquestador:\n'"$extra"

# Ejecuta OpenCode con un vigilante (portátil: no depende de `timeout`, que macOS no trae):
#   - si el último evento es el cierre final del modelo (step_finish con reason "stop") y no llega
#     nada nuevo en AES_OC_IDLE segundos, da la ejecución por terminada y cierra OpenCode (se ha visto
#     a `opencode run` quedarse vivo después de terminar);
#   - si pasa AES_OC_TIMEOUT segundos en total, lo corta (código 124).
# Sin credenciales de la app ni de GitHub en su entorno: publicar es del orquestador (06 §10).
oc() { # $1 archivo de eventos, $2 archivo de errores, resto: argumentos de opencode run
  local out=$1 err=$2; shift 2
  (
    unset AES_APP_ID AES_APP_INSTALLATION_ID AES_APP_PRIVATE_KEY GH_TOKEN GITHUB_TOKEN
    export AES_ROLE="$role"
    cd "$wt" && exec opencode run --agent "$role" -m "$model" --dir "$wt" --format json "$@"
  ) > "$out" 2>> "$err" &
  local pid=$! limit=${AES_OC_TIMEOUT:-3600} idle_max=${AES_OC_IDLE:-30} t=0 idle=0 size=-1 now
  while kill -0 "$pid" 2>/dev/null; do
    sleep 2; t=$((t + 2))
    now=$(wc -c < "$out" | tr -d ' ')
    if [[ "$now" == "$size" ]]; then idle=$((idle + 2)); else idle=0; size=$now; fi
    if (( idle >= idle_max )) && tail -n 1 "$out" | grep -q '"type":"step_finish"' \
       && tail -n 1 "$out" | grep -q '"reason":"stop"'; then
      kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; return 0
    fi
    if (( t >= limit )); then
      kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true
      echo "aes-oc: OpenCode superó AES_OC_TIMEOUT (${limit}s)." >> "$err"; return 124
    fi
  done
  wait "$pid"
}

echo "aes-oc: $role en $branch con $model (worktree $wt)" >&2
rc=0; : > "$runs/$stamp.err"; oc "$ev1" "$runs/$stamp.err" --title "$branch" "$prompt" || rc=$?
session=$(jq -r 'select(.sessionID != null) | .sessionID' "$ev1" | head -n1)
if [[ $rc -ne 0 || -z "$session" ]] || jq -e 'select(.type == "error")' "$ev1" >/dev/null; then
  echo "aes-oc: OpenCode falló (código $rc)." >&2
  jq -r 'select(.type == "error") | .error.data.message // .error.name' "$ev1" >&2 || true
  tail -n 5 "$runs/$stamp.err" >&2 || true
  exit 4
fi

gate() { # $1 = archivo de log
  jq -n --arg r "$role" --arg c "$wt" '{agent_type: $r, cwd: $c, stop_hook_active: false}' \
    | bash .claude/hooks/subagent-gate.sh > /dev/null 2> "$1"
}
status=ok; files=("$ev1")
if ! gate "$gatelog"; then
  echo "aes-oc: la compuerta de fin de rol falló; reanudo la sesión una vez." >&2
  retry_msg="La comprobación de fin de rol de AES falló:
$(cat "$gatelog")
Corrige sin tocar pruebas protegidas ni salir de la superficie y vuelve a dar tu reporte final, o termina con BLOCKED y la causa."
  oc "$ev2" "$runs/$stamp.err" --session "$session" "$retry_msg" || true
  files+=("$ev2")
  gate "$gatelog.2" || { status=gate-failed; gatelog="$gatelog.2"; }
fi

final=$(jq -rs '[.[] | select(.type == "text") | .part.text] | last // ""' "${files[@]}")
# shellcheck disable=SC2016  # las comillas invertidas son parte del patrón
blocked_re='estado( propuesto)?[^a-z]{0,4}[:=][[:space:]*`]*BLOCKED|^[[:space:]*`#-]*BLOCKED'
grep -qiE "$blocked_re" <<< "$final" && status=blocked

read -r steps tin tout treas tcache cost_oc cost_est <<< "$(summarize "${files[@]}")"
csv=.aes/costs.csv
[[ -f "$csv" ]] || echo "fecha_utc,elemento,rama,rol,modelo,sesion,pasos,entrada,salida,razonamiento,cache,usd_opencode,usd_estimado,estado" > "$csv"
printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' "$stamp" "$item" "$branch" "$role" "$model" "$session" \
  "$steps" "$tin" "$tout" "$treas" "$tcache" "$cost_oc" "$cost_est" "$status" >> "$csv"
opencode export "$session" > "$runs/$stamp.session.json" 2>/dev/null || true

base=$(cd "$wt" && bash .claude/scripts/aes-base.sh 2>/dev/null || echo origin/dev)
{
  echo "=== AES · $role · $branch · $model ==="
  echo "Estado de la compuerta: $status"
  printf 'Costo: %s pasos · %s entrada · %s salida · %s razonamiento · %s en caché · USD %s (OpenCode) · USD %s (estimado)\n' \
    "$steps" "$tin" "$tout" "$treas" "$tcache" "$cost_oc" "$cost_est"
  echo "Sesión: $session (eventos en $runs/)"
  echo "--- commits ---"; git -C "$wt" log --oneline "$base"..HEAD 2>/dev/null || true
  echo "--- archivos ---"; git -C "$wt" diff --stat "$base"...HEAD 2>/dev/null | tail -n 20 || true
  [[ $status == gate-failed ]] && { echo "--- compuerta ---"; tail -n 30 "$gatelog"; }
  echo "--- reporte del rol ---"; printf '%s\n' "$final"
}

if [[ -z "$(git -C "$wt" status --porcelain)" ]]; then
  bash .claude/scripts/aes-wt.sh close "$branch" >/dev/null 2>&1 || true
else
  echo "(El worktree $wt queda abierto: tiene cambios sin commit.)"
fi
[[ $status == ok ]] && exit 0 || exit 3
