#!/usr/bin/env bash
# AES 1.2.0 — ¿Una etiqueta de aprobación la puso una persona autorizada? (standard/06 §8), capa L3.
#
# Una etiqueta que la identidad de los agentes puede poner no es una aprobación. Este script
# mira el ÚLTIMO evento «labeled» de la etiqueta en el PR y exige que su autor esté en
# AES_APPROVERS y no sea una cuenta [bot]. La etiqueta debe seguir puesta.
#
# Uso: label-approver.sh <etiqueta>
# Variables:
#   REPO, PR          owner/repo y número del PR
#   GH_TOKEN          token con lectura de issues/PR (en Actions, GITHUB_TOKEN)
#   AES_APPROVERS     logins autorizados, separados por coma (p. ej. "tu-usuario")
#   AES_EVENTS_FILE   (pruebas) JSON de eventos en lugar de llamar a la API
#
# Imprime 1 si la aprobación es válida y 0 si no; el motivo va a stderr. Sale siempre con 0
# salvo error de uso, para que el workflow decida qué hacer con el resultado.
set -euo pipefail

label="${1:-}"
[[ -n "$label" ]] || { echo "Uso: label-approver.sh <etiqueta>" >&2; exit 2; }

if [[ -n "${AES_EVENTS_FILE:-}" ]]; then
  events=$(cat "$AES_EVENTS_FILE")
else
  : "${REPO:?Falta REPO}"; : "${PR:?Falta PR}"
  events=$(gh api "repos/$REPO/issues/$PR/events" --paginate | jq -s 'add // []')
fi

# Estado actual de la etiqueta: el último evento labeled/unlabeled decide si sigue puesta.
last=$(jq -c --arg l "$label" '[.[] | select((.event == "labeled" or .event == "unlabeled") and .label.name == $l)] | last // empty' <<< "$events")
if [[ -z "$last" || "$(jq -r '.event' <<< "$last")" != "labeled" ]]; then
  echo "AES: la etiqueta '$label' no está puesta." >&2
  echo 0; exit 0
fi

actor=$(jq -r '.actor.login // ""' <<< "$last")
actor_type=$(jq -r '.actor.type // ""' <<< "$last")

if [[ -z "${AES_APPROVERS:-}" ]]; then
  echo "AES WARN: AES_APPROVERS no está definido; no se puede comprobar quién puso '$label' (la puso $actor). Defínelo como variable del repositorio." >&2
  if [[ "$actor_type" == "Bot" || "$actor" == *"[bot]" ]]; then
    echo "AES: '$label' la puso una cuenta bot ($actor): no es una aprobación." >&2
    echo 0; exit 0
  fi
  echo 1; exit 0
fi

if [[ "$actor_type" == "Bot" || "$actor" == *"[bot]" ]]; then
  echo "AES: '$label' la puso una cuenta bot ($actor): no es una aprobación." >&2
  echo 0; exit 0
fi
IFS=',' read -r -a approvers <<< "${AES_APPROVERS// /}"
for a in "${approvers[@]}"; do
  if [[ "${a,,}" == "${actor,,}" ]]; then
    echo "AES: '$label' aprobada por $actor." >&2
    echo 1; exit 0
  fi
done
echo "AES: '$label' la puso $actor, que no está en AES_APPROVERS: no es una aprobación." >&2
echo 0
