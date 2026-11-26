#!/usr/bin/env bash
# AES — Stabilization gate (standard/02 §9.2), layer L3.
#
# Reads the backlog FROM THE BASE (not from the branch) and decides whether the item can advance.
# The backlog table must have the columns "ID", "Severity" and "Status" (in any order; the Spanish
# "Severidad" and "Estado" work too). Only rows with a severity count (the defects).
# Open = Status other than Accepted/Rejected/Released.
#
# Usage: defect-gate.sh <phase> <item-ID>
#   start  the item is about to move to Ready (branch qa/<ID>): Critical, High, Medium and
#          Minor above the limit block
#   work   the item is in progress (branches task/<ID>/*): only Critical blocks
#   release  PR from dev to main (standard/07 §8): the same rules as start, with no exemptions;
#            it reads the backlog from BASE (in a release, the candidate: HEAD)
#   report only reports (push to main)
#
# Variables:
#   BASE                protected ref (origin/dev by default)
#   AES_BACKLOG         path of the backlog in the base (docs/backlog.md by default)
#   AES_MINOR_LIMIT     maximum open Minor defects (5 by default)
#   AES_GATE_EXEMPT     prefixes that do not go through the gate, space-separated:
#                       the items that fix or maintain ("BUG ST CH SP" by default)
#
# Exit: 0 = it can advance, 1 = gate closed, 2 = usage or format error.
set -euo pipefail

phase="${1:-}"; item="${2:-}"
BASE="${BASE:-origin/dev}"
BACKLOG="${AES_BACKLOG:-docs/backlog.md}"
LIMIT="${AES_MINOR_LIMIT:-5}"
EXEMPT="${AES_GATE_EXEMPT:-BUG ST CH SP}"

case "$phase" in start|work|release|report) ;; *) echo "Usage: defect-gate.sh start|work|release|report <ID>" >&2; exit 2 ;; esac

prefix="${item%%-*}"
if [[ "$phase" =~ ^(start|work)$ && -n "$item" ]] && [[ " $EXEMPT " == *" $prefix "* ]]; then
  echo "AES defect-gate: $item fixes or maintains ($prefix): it does not go through the gate."
  exit 0
fi

if ! content=$(git show "$BASE:$BACKLOG" 2>/dev/null); then
  echo "AES defect-gate: $BACKLOG does not exist in $BASE; there are no defects to evaluate."
  exit 0
fi

# Extracts "ID<TAB>severity<TAB>status" from each row with a severity, locating the columns by their header.
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
    if (skip) { skip = 0; next }   # separator row |---|
    s = trim($sev)
    if (s != "" && s != "—" && s != "-") print trim($id) "\t" s "\t" trim($st)
    next
  }
  { if (hdr) hdr = 0 }            # the table ended
' <<< "$content")

norm() { tr '[:upper:]' '[:lower:]' <<< "$1" | sed 's/í/i/g; s/á/a/g'; }

declare -a crit high med minor
crit=(); high=(); med=(); minor=()
while IFS=$'\t' read -r id sev st; do
  [[ -z "$id" ]] && continue
  case "$(norm "$st")" in accepted|rejected|released) continue ;; esac
  case "$(norm "$sev")" in
    critica|critical) crit+=("$id") ;;
    alta|high)        high+=("$id") ;;
    media|medium)     med+=("$id") ;;
    menor|minor|baja|low) minor+=("$id") ;;
    *) echo "AES defect-gate: unknown severity \"$sev\" in $id (use Critical, High, Medium or Minor)." >&2; exit 2 ;;
  esac
done <<< "$rows"

echo "AES defect-gate ($phase${item:+, $item}) — open defects in $BASE:$BACKLOG"
echo "  Critical: ${#crit[@]} ${crit[*]:-}"
echo "  High:     ${#high[@]} ${high[*]:-}"
echo "  Medium:   ${#med[@]} ${med[*]:-}"
echo "  Minor:    ${#minor[@]} ${minor[*]:-} (limit $LIMIT)"

closed=0
case "$phase" in
  start|release)
    if (( ${#crit[@]} + ${#high[@]} + ${#med[@]} > 0 )); then
      if [[ "$phase" == "release" ]]; then
        echo "::error::Cannot release: there are open Critical, High or Medium defects (AES 02 §9.2, 07 §8)."
      else
        echo "::error::Stabilization gate closed: there are open Critical, High or Medium defects. Fix them in a stabilization batch before moving $item to Ready (AES 02 §9)."
      fi
      closed=1
    fi
    if (( ${#minor[@]} > LIMIT )); then
      echo "::error::Stabilization gate closed: ${#minor[@]} open Minor defects (limit $LIMIT)."
      closed=1
    fi
    ;;
  work)
    if (( ${#crit[@]} > 0 )); then
      echo "::error::There is an open Critical defect: all work stops except its fix (AES 02 §9.2)."
      closed=1
    fi
    ;;
esac
(( closed == 0 )) && echo "AES defect-gate: OK"
exit $closed
