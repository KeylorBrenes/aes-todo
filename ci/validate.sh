#!/usr/bin/env bash
# AES — Validaciones del proyecto que el programador y el mecánico deben pasar antes de terminar
# (las ejecuta .claude/hooks/subagent-gate.sh). Específico del stack: Rust (Axum) + React (Vite).
# Mantén aquí los mismos comandos que la sección STACK del workflow (salvo las auditorías,
# que necesitan red y solo corren en la CI).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [[ -f src/server/Cargo.toml ]]; then
  cargo fmt --check --manifest-path src/server/Cargo.toml
  cargo clippy --manifest-path src/server/Cargo.toml --all-targets --locked -- -D warnings
  cargo test --manifest-path src/server/Cargo.toml --locked
fi

if [[ -f src/web/package.json ]]; then
  [[ -d src/web/node_modules ]] || npm --prefix src/web ci --silent
  npm --prefix src/web run lint --silent
  npm --prefix src/web run typecheck --silent
  npm --prefix src/web test --silent
  npm --prefix src/web run build --silent
fi
