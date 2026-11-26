#!/usr/bin/env bash
# AES — Was an approval label put on by an authorized person? (standard/06 §8), layer L3.
#
# A label the agents' identity can put on is not an approval. This script
# looks at the label's LAST "labeled" event on the PR and requires its author to be in
# AES_APPROVERS and not to be a [bot] account. The label must still be on.
#
# Usage: label-approver.sh <label>
# Variables:
#   REPO, PR          owner/repo and PR number
#   GH_TOKEN          token with read access to issues/PRs (in Actions, GITHUB_TOKEN)
#   AES_APPROVERS     authorized logins, comma-separated (e.g. "your-user")
#   AES_EVENTS_FILE   (tests) events JSON instead of calling the API
#
# It prints 1 if the approval is valid and 0 if not; the reason goes to stderr. It always exits with 0
# except on a usage error, so that the workflow decides what to do with the result.
set -euo pipefail

label="${1:-}"
[[ -n "$label" ]] || { echo "Usage: label-approver.sh <label>" >&2; exit 2; }

if [[ -n "${AES_EVENTS_FILE:-}" ]]; then
  events=$(cat "$AES_EVENTS_FILE")
else
  : "${REPO:?Falta REPO}"; : "${PR:?Falta PR}"
  events=$(gh api "repos/$REPO/issues/$PR/events" --paginate | jq -s 'add // []')
fi

# Current state of the label: the last labeled/unlabeled event decides whether it is still on.
last=$(jq -c --arg l "$label" '[.[] | select((.event == "labeled" or .event == "unlabeled") and .label.name == $l)] | last // empty' <<< "$events")
if [[ -z "$last" || "$(jq -r '.event' <<< "$last")" != "labeled" ]]; then
  echo "AES: the label '$label' is not on." >&2
  echo 0; exit 0
fi

actor=$(jq -r '.actor.login // ""' <<< "$last")
actor_type=$(jq -r '.actor.type // ""' <<< "$last")

if [[ -z "${AES_APPROVERS:-}" ]]; then
  echo "AES WARN: AES_APPROVERS is not defined; it cannot be checked who put on '$label' (it was $actor). Define it as a repository variable." >&2
  if [[ "$actor_type" == "Bot" || "$actor" == *"[bot]" ]]; then
    echo "AES: '$label' was put on by a bot account ($actor): it is not an approval." >&2
    echo 0; exit 0
  fi
  echo 1; exit 0
fi

if [[ "$actor_type" == "Bot" || "$actor" == *"[bot]" ]]; then
  echo "AES: '$label' was put on by a bot account ($actor): it is not an approval." >&2
  echo 0; exit 0
fi
IFS=',' read -r -a approvers <<< "${AES_APPROVERS// /}"
for a in "${approvers[@]}"; do
  if [[ "${a,,}" == "${actor,,}" ]]; then
    echo "AES: '$label' approved by $actor." >&2
    echo 1; exit 0
  fi
done
echo "AES: '$label' was put on by $actor, who is not in AES_APPROVERS: it is not an approval." >&2
echo 0
