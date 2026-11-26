#!/usr/bin/env bash
# AES 2.0.0 — Adds a row to the orchestrator's pending notes, stamped with the REAL time (FL-009).
#
# Usage:
#   bash .claude/scripts/aes-note.sh finding "<phase / role>" "<finding>" "<type>" "<impact on AES>"
#   bash .claude/scripts/aes-note.sh failure "<agent / model>" "<symptom>" "<detected by>" "<proposed control>"
#   bash .claude/scripts/aes-note.sh decision "<item ID>" "<question>" "<decision>" "<impact>"
#   bash .claude/scripts/aes-note.sh clear      (empties the notes once they are consolidated at close)
#
# Finding types: Confirmation · Friction · Agent failure · Control gap · Design · Cost.
# Writes to .aes/ (ignored by git); consolidated into docs/ when the item closes. The table headers
# follow the project language (AES_LANG in .claude/aes.env: en or es).
set -euo pipefail

kind="${1:-}"; shift || true
root=$(git rev-parse --show-toplevel)
dir="$root/.aes"
mkdir -p "$dir"
now=$(date '+%Y-%m-%d %H:%M')
esc() { local s="${1//|/\\|}"; printf '%s' "${s//$'\n'/ }"; }
lang=""
[[ -f "$root/.claude/aes.env" ]] && lang=$(sed -nE 's/^AES_LANG="?(en|es).*/\1/p' "$root/.claude/aes.env" | sed -n 1p)
lang=${lang:-en}

header() { # $1 file, $2 English title|columns, $3 Spanish title|columns
  local spec; [[ $lang == es ]] && spec=$3 || spec=$2
  local title=${spec%%|*} cols=${spec#*|}
  [[ -s "$1" ]] || printf '# %s\n\n| %s |\n|---|---|---|---|---|\n' "$title" "${cols//;/ | }" > "$1"
}
row() { printf '| %s | %s | %s | %s | %s |\n' "$now" "$(esc "$1")" "$(esc "$2")" "$(esc "$3")" "$(esc "${4:-—}")" >> "$file"; }

case "$kind" in
  finding)
    file="$dir/findings-pending.md"
    (( $# >= 3 )) || { echo "Usage: aes-note.sh finding <phase/role> <finding> <type> [impact]" >&2; exit 1; }
    header "$file" "Findings pending consolidation|Date and time;Phase / role;Finding;Type;Impact on AES" \
                   "Hallazgos pendientes de consolidar|Fecha y hora;Fase / rol;Hallazgo;Tipo;Impacto en AES"
    row "$@" ;;
  failure)
    file="$dir/failures-pending.md"
    (( $# >= 3 )) || { echo "Usage: aes-note.sh failure <agent/model> <symptom> <detected by> [control]" >&2; exit 1; }
    header "$file" "Agent failures pending consolidation|Date and time;Agent / model;Symptom;Detected by;Proposed control" \
                   "Fallos de agentes pendientes de consolidar|Fecha y hora;Agente / modelo;Síntoma;Detectado por;Control propuesto"
    row "$@" ;;
  decision)
    file="$dir/decisions-pending.md"
    (( $# >= 3 )) || { echo "Usage: aes-note.sh decision <ID> <question> <decision> [impact]" >&2; exit 1; }
    header "$file" "Decisions pending transcription to the item|Date and time;Item;Question;Decision;Impact" \
                   "Decisiones pendientes de transcribir a la historia|Fecha y hora;Historia;Pregunta;Decisión;Impacto"
    row "$@" ;;
  clear)
    # Run by the human (or the orchestrator) after the close PR is merged: the notes are already
    # consolidated in docs/. Not a role's job (09 §7).
    rm -f "$dir/findings-pending.md" "$dir/failures-pending.md" "$dir/decisions-pending.md"
    echo "Notes in .aes/ cleared ($now)."
    exit 0 ;;
  *)
    echo "Usage: aes-note.sh finding|failure|decision|clear ..." >&2; exit 1 ;;
esac
echo "Noted in ${file#"$root"/} ($now)"
