#!/usr/bin/env bash
# AES 1.3.0 — Compuerta de estabilización (standard/02 §9.2), capa L3.
#
# Lee el backlog DESDE LA BASE (no desde la rama) y decide si el elemento puede avanzar.
# La tabla del backlog debe tener columnas «ID», «Severidad» y «Estado» (en cualquier orden).
# Solo cuentan las filas con severidad (los defectos). Abierto = Estado distinto de Accepted/Rejected.
#
# Uso: defect-gate.sh <fase> <ID-elemento>
#   start  el elemento va a pasar a Ready (rama qa/<ID>): bloquean Crítica, Alta, Media y
#          Menores por encima del límite
#   work   el elemento está en curso (ramas task/<ID>/*): solo bloquea Crítica
#   release  PR de dev a main (standard/07 §8): mismas reglas que start, sin exenciones;
#            lee el backlog de BASE (en un release, el candidato: HEAD)
#   report solo informa (push a main)
#
# Variables:
#   BASE                ref protegida (por defecto origin/dev)
#   AES_BACKLOG         ruta del backlog en la base (por defecto docs/backlog.md)
#   AES_MINOR_LIMIT     máximo de defectos Menores abiertos (por defecto 5)
#   AES_GATE_EXEMPT     prefijos que no pasan por la compuerta, separados por espacio:
#                       los elementos que corrigen o mantienen (por defecto "BUG ST CH SP")
#
# Salida: 0 = puede avanzar, 1 = compuerta cerrada, 2 = error de uso o de formato.
set -euo pipefail

phase="${1:-}"; item="${2:-}"
BASE="${BASE:-origin/dev}"
BACKLOG="${AES_BACKLOG:-docs/backlog.md}"
LIMIT="${AES_MINOR_LIMIT:-5}"
EXEMPT="${AES_GATE_EXEMPT:-BUG ST CH SP}"

case "$phase" in start|work|release|report) ;; *) echo "Uso: defect-gate.sh start|work|release|report <ID>" >&2; exit 2 ;; esac

prefix="${item%%-*}"
if [[ "$phase" =~ ^(start|work)$ && -n "$item" ]] && [[ " $EXEMPT " == *" $prefix "* ]]; then
  echo "AES defect-gate: $item corrige o mantiene ($prefix): no pasa por la compuerta."
  exit 0
fi

if ! content=$(git show "$BASE:$BACKLOG" 2>/dev/null); then
  echo "AES defect-gate: no existe $BACKLOG en $BASE; no hay defectos que evaluar."
  exit 0
fi

# Extrae «ID<TAB>severidad<TAB>estado» de cada fila con severidad, ubicando las columnas por su encabezado.
rows=$(awk -F'|' '
  function trim(s) { gsub(/^[ \t`*]+|[ \t`*]+$/, "", s); return s }
  /^\|/ {
    if (!hdr) {
      id = sev = st = 0
      for (i = 2; i < NF; i++) {
        h = tolower(trim($i))
        if (h == "id") id = i
        else if (h == "severidad" || h == "severity") sev = i
        else if (h == "estado" || h == "status") st = i
      }
      if (id && sev && st) { hdr = 1; skip = 1 }
      next
    }
    if (skip) { skip = 0; next }   # fila separadora |---|
    s = trim($sev)
    if (s != "" && s != "—" && s != "-") print trim($id) "\t" s "\t" trim($st)
    next
  }
  { if (hdr) hdr = 0 }            # la tabla terminó
' <<< "$content")

norm() { tr '[:upper:]' '[:lower:]' <<< "$1" | sed 's/í/i/g; s/á/a/g'; }

declare -a crit high med minor
crit=(); high=(); med=(); minor=()
while IFS=$'\t' read -r id sev st; do
  [[ -z "$id" ]] && continue
  case "$(norm "$st")" in accepted|rejected) continue ;; esac
  case "$(norm "$sev")" in
    critica|critical) crit+=("$id") ;;
    alta|high)        high+=("$id") ;;
    media|medium)     med+=("$id") ;;
    menor|minor|baja|low) minor+=("$id") ;;
    *) echo "AES defect-gate: severidad desconocida «$sev» en $id (usa Crítica, Alta, Media o Menor)." >&2; exit 2 ;;
  esac
done <<< "$rows"

echo "AES defect-gate ($phase${item:+, $item}) — defectos abiertos en $BASE:$BACKLOG"
echo "  Crítica: ${#crit[@]} ${crit[*]:-}"
echo "  Alta:    ${#high[@]} ${high[*]:-}"
echo "  Media:   ${#med[@]} ${med[*]:-}"
echo "  Menor:   ${#minor[@]} ${minor[*]:-} (límite $LIMIT)"

closed=0
case "$phase" in
  start|release)
    if (( ${#crit[@]} + ${#high[@]} + ${#med[@]} > 0 )); then
      if [[ "$phase" == "release" ]]; then
        echo "::error::No se puede liberar: hay defectos Críticos, Altos o Medios abiertos (AES 02 §9.2, 07 §8)."
      else
        echo "::error::Compuerta de estabilización cerrada: hay defectos Críticos, Altos o Medios abiertos. Corrígelos en un lote de estabilización antes de pasar $item a Ready (AES 02 §9)."
      fi
      closed=1
    fi
    if (( ${#minor[@]} > LIMIT )); then
      echo "::error::Compuerta de estabilización cerrada: ${#minor[@]} defectos Menores abiertos (límite $LIMIT)."
      closed=1
    fi
    ;;
  work)
    if (( ${#crit[@]} > 0 )); then
      echo "::error::Hay un defecto Crítico abierto: se detiene todo el trabajo salvo su corrección (AES 02 §9.2)."
      closed=1
    fi
    ;;
esac
(( closed == 0 )) && echo "AES defect-gate: OK"
exit $closed
