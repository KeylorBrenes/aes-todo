#!/usr/bin/env bash
# AES 2.1 — Adds a row to the orchestrator's pending notes, stamped with the REAL time (FL-009).
#
# Usage:
#   bash .claude/scripts/aes-note.sh finding "<phase / role>" "<finding>" "<type>" "<impact on AES>"
#   bash .claude/scripts/aes-note.sh failure "<agent / model>" "<symptom>" "<detected by>" "<proposed control>"
#   bash .claude/scripts/aes-note.sh decision "<item ID>" "<question>" "<decision>" "<impact>"
#   bash .claude/scripts/aes-note.sh consolidate <ID>  (at close, on the close branch: moves the findings
#        into docs/harness-findings.md and the failures into docs/agent-failure-log.md, as FL-NNN entries;
#        decisions stay for the orchestrator, who numbers them D-NN in the item)
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
  consolidate)
    # 2.1: transcribing notes is mechanical, so a script does it, not a role (09 §7). Run it in the
    # close branch's worktree with AES_NOTES_DIR pointing at the main checkout's .aes/ if needed.
    id=${1:?Usage: aes-note.sh consolidate <ID>}
    src=${AES_NOTES_DIR:-$dir}
    hf="$root/docs/harness-findings.md"; ff="$root/docs/agent-failure-log.md"
    rows() { [[ -f "$1" ]] && grep -E '^\| [0-9]{4}-' "$1" || true; }
    insert_rows() { # $1 file, $2 heading regex, $3 rows: after the last row of the table under the heading
      local tmp; tmp=$(mktemp)
      # Rows through the environment: awk -v would turn the escaped pipes (\|) into |.
      if ! AES_ROWS="$3" awk -v re="$2" '
        { line[NR] = $0 }
        END {
          h = 0; for (i = 1; i <= NR; i++) if (line[i] ~ re) { h = i; break }
          if (h == 0) { for (i = 1; i <= NR; i++) print line[i]; exit 2 }
          t = h + 1; while (t <= NR && line[t] !~ /^\|/) t++
          while (t <= NR && line[t] ~ /^\|/) t++
          for (i = 1; i < t; i++) print line[i]
          print ENVIRON["AES_ROWS"]
          for (i = t; i <= NR; i++) print line[i]
        }' "$1" > "$tmp"; then
        rm -f "$tmp"; echo "No table under $2 in ${1#"$root"/}." >&2; return 1
      fi
      mv "$tmp" "$1"
    }
    f_rows=$(rows "$src/findings-pending.md")
    if [[ -n "$f_rows" ]]; then
      [[ -f "$hf" ]] || { echo "docs/harness-findings.md does not exist." >&2; exit 1; }
      insert_rows "$hf" '^## (Log|Registro)' "$f_rows"
      echo "Findings: $(grep -c . <<< "$f_rows") rows → docs/harness-findings.md"
    fi
    x_rows=$(rows "$src/failures-pending.md")
    if [[ -n "$x_rows" ]]; then
      [[ -f "$ff" ]] || { echo "docs/agent-failure-log.md does not exist." >&2; exit 1; }
      n=$(grep -oE '^## FL-[0-9]+' "$ff" | grep -oE '[0-9]+' | sort -n | tail -n1); n=$((10#${n:-0}))
      while IFS= read -r r; do
        IFS='|' read -r _ when agent symptom detected control _ <<< "$r"
        n=$((n + 1)); trim() { sed -E 's/^ +| +$//g' <<< "$1"; }; when=$(trim "$when")
        if [[ $lang == es ]]; then
          printf '\n## FL-%03d — %s\n- **Agente / harness / modelo:** %s\n- **Tarea / historia:** %s\n- **Síntoma:** %s\n- **Detectado por:** %s\n- **Causa probable:** —\n- **Control propuesto:** %s\n- **Aprobado por / fecha:** —\n- **Verificado en:** —\n' \
            "$n" "$(trim "${when%% *}")" "$(trim "$agent")" "$id" "$(trim "$symptom")" "$(trim "$detected")" "$(trim "$control")" >> "$ff"
        else
          printf '\n## FL-%03d — %s\n- **Agent / harness / model:** %s\n- **Task / story:** %s\n- **Symptom:** %s\n- **Detected by:** %s\n- **Probable cause:** —\n- **Proposed control:** %s\n- **Approved by / date:** —\n- **Verified in:** —\n' \
            "$n" "$(trim "${when%% *}")" "$(trim "$agent")" "$id" "$(trim "$symptom")" "$(trim "$detected")" "$(trim "$control")" >> "$ff"
        fi
      done <<< "$x_rows"
      echo "Failures: $(grep -c . <<< "$x_rows") entries → docs/agent-failure-log.md (up to FL-$(printf '%03d' "$n"))"
    fi
    [[ -s "$src/decisions-pending.md" ]] && echo "Decisions pending in ${src#"$root"/}/decisions-pending.md: the orchestrator writes them as D-NN in the item."
    [[ -z "$f_rows$x_rows" ]] && echo "Nothing to consolidate."
    exit 0 ;;
  clear)
    # Run by the human (or the orchestrator) after the close PR is merged: the notes are already
    # consolidated in docs/. Not a role's job (09 §7).
    rm -f "$dir/findings-pending.md" "$dir/failures-pending.md" "$dir/decisions-pending.md"
    echo "Notes in .aes/ cleared ($now)."
    exit 0 ;;
  *)
    echo "Usage: aes-note.sh finding|failure|decision|consolidate|clear ..." >&2; exit 1 ;;
esac
echo "Noted in ${file#"$root"/} ($now)"
