#!/usr/bin/env bash
# AES — Git credential helper that hands out the token of the agents' GitHub App.
# Git calls it with "get", "store" or "erase" and passes key=value lines on stdin.
# We only answer "get" for github.com; the rest is ignored.
set -euo pipefail

[[ "${1:-}" == "get" ]] || exit 0

host=""
while IFS='=' read -r key value; do
  [[ -z "$key" ]] && break
  [[ "$key" == "host" ]] && host="$value"
done

[[ "$host" == "github.com" ]] || exit 0

token=$(bash "$(dirname "$0")/gh-app-token.sh")
printf 'username=x-access-token\npassword=%s\n' "$token"
