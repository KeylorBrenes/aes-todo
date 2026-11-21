#!/usr/bin/env bash
# AES — Validaciones del proyecto que el programador y el mecánico deben pasar antes de terminar
# (las ejecuta .claude/hooks/subagent-gate.sh). Específico del stack: ejemplo .NET + React.
# Mantén aquí los mismos comandos que la sección STACK del workflow.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if compgen -G "*.slnx" >/dev/null || compgen -G "*.sln" >/dev/null; then
  dotnet build -warnaserror -nologo -v q
  dotnet test --no-build -nologo -v q
fi

if [[ -f web/package.json ]]; then
  npm --prefix web run lint --silent
  npm --prefix web test --silent
  npm --prefix web run build --silent
fi
