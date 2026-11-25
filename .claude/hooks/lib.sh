#!/usr/bin/env bash
# AES — funciones compartidas por los hooks. Se carga con: source "$(dirname "$0")/lib.sh"

# Rutas que ningún rol de implementación puede tocar (se usa en role-guard.sh).
# shellcheck disable=SC2034
AES_PROTECTED_RE='^(tests/acceptance/|specs/|ci/|\.github/|\.claude/|\.opencode/|docs/ci/|opencode\.json$|AGENTS\.md$|CLAUDE\.md$)'

# Lee la entrada JSON del hook una sola vez.
aes_read_input() { AES_INPUT=$(cat); }
aes_get() { jq -r "$1 // empty" <<< "$AES_INPUT"; }

# Rol: vacío = sesión principal (orquestador). Si no, el nombre del subagente.
aes_role() { aes_get '.agent_type'; }

# Normaliza una ruta (Windows o POSIX) a forma con "/" y sin "./".
aes_norm() { local p="${1//\\//}"; printf '%s' "${p#./}"; }

# Raíz del repositorio que contiene una ruta (o el cwd del hook).
aes_repo_root() {
  local dir="$1"
  [[ -d "$dir" ]] || dir=$(dirname "$dir")
  while [[ ! -d "$dir" && "$dir" != "." && "$dir" != "/" ]]; do dir=$(dirname "$dir"); done
  git -C "$dir" rev-parse --show-toplevel 2>/dev/null || git rev-parse --show-toplevel 2>/dev/null
}

# Convierte una ruta absoluta en relativa a la raíz del repo (comparación sin distinguir mayúsculas,
# porque en Windows "h:/" y "H:/" son la misma unidad). Imprime vacío si está fuera del repo.
aes_rel_path() {
  local file root lf lr
  file=$(aes_norm "$1"); root=$(aes_norm "$2")
  # Git Bash puede devolver /h/Proyectos en lugar de H:/Proyectos: unificar.
  if [[ "$root" =~ ^/([a-zA-Z])/(.*)$ ]]; then root="${BASH_REMATCH[1]}:/${BASH_REMATCH[2]}"; fi
  if [[ "$file" =~ ^/([a-zA-Z])/(.*)$ ]]; then file="${BASH_REMATCH[1]}:/${BASH_REMATCH[2]}"; fi
  # Ruta relativa: ya es relativa al repo.
  if [[ ! "$file" =~ ^([a-zA-Z]:)?/ ]]; then printf '%s' "$file"; return; fi
  lf=$(tr '[:upper:]' '[:lower:]' <<< "$file"); lr=$(tr '[:upper:]' '[:lower:]' <<< "$root")
  if [[ "$lf" == "$lr"/* ]]; then printf '%s' "${file:${#root}+1}"; fi
}

# Rama actual y archivo .scope asociado (task/<ID>/<TASK> → specs/<ID>/<TASK>.scope).
aes_branch() { git -C "$1" rev-parse --abbrev-ref HEAD 2>/dev/null; }
aes_scope_file() {
  local branch="$1"
  if [[ "$branch" =~ ^task/([^/]+)/([^/]+)$ ]]; then
    printf 'specs/%s/%s.scope' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
  fi
}

# ¿La ruta relativa coincide con algún glob del .scope?
aes_in_scope() {
  local rel="$1" scope="$2" glob
  while IFS= read -r glob || [[ -n "$glob" ]]; do
    glob="${glob%%#*}"; glob="${glob//[[:space:]]/}"; glob="${glob//$'\r'/}"
    [[ -z "$glob" ]] && continue
    # shellcheck disable=SC2053  # el glob debe evaluarse como patrón
    [[ "$rel" == $glob ]] && return 0
  done < "$scope"
  return 1
}

aes_block() { printf 'AES [%s]: %s\n' "${AES_ROLE:-orquestador}" "$*" >&2; exit 2; }

# ¿Hay un proceso escuchando en el puerto? Linux: /proc/net/tcp(6) (no depende de ss/netstat).
# Windows/macOS: netstat. Lo usan subagent-gate.sh y .claude/scripts/aes-oc.sh.
port_listening() {
  local port="$1" hex
  if [[ -r /proc/net/tcp ]]; then
    local files=(/proc/net/tcp)
    [[ -r /proc/net/tcp6 ]] && files+=(/proc/net/tcp6)
    hex=$(printf '%04X' "$port")
    awk -v h=":${hex}" '$4 == "0A" && substr($2, length($2) - 4) == h { found = 1 } END { exit !found }' \
      "${files[@]}" 2>/dev/null
  elif command -v netstat >/dev/null 2>&1; then
    { netstat -ano 2>/dev/null || netstat -an 2>/dev/null; } | grep -iE "[:.]${port}[[:space:]].*(LISTENING|ESCUCHANDO|LISTEN)" >/dev/null
  else
    return 1
  fi
}
