// AES 1.4.0 — Capa L2 para los roles que corren en OpenCode (standard/06 §9, §12).
//
// No duplica reglas: traduce cada herramienta de OpenCode al formato de hook de Claude Code y llama
// a los mismos scripts (.claude/hooks/role-guard.sh y bash-guard.sh). Si el script bloquea (código 2),
// la herramienta falla con su mensaje y el modelo lo recibe, igual que con un hook de Claude Code.
//
// El rol llega en AES_ROLE, que pone .claude/scripts/aes-oc.sh. Sin AES_ROLE (OpenCode usado a mano,
// fuera de AES) el plugin no hace nada.
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const FILE_TOOLS = new Set(["write", "edit", "multiedit", "patch", "apply_patch"]);

export const AesGuard = async ({ directory, worktree }) => {
  const role = process.env.AES_ROLE || "";
  const root = worktree || directory;
  const hooks = path.join(root, ".claude", "hooks");
  const bash = process.env.AES_BASH || "bash";

  const runHook = (script, input) => {
    const file = path.join(hooks, script);
    if (!fs.existsSync(file)) {
      throw new Error(`AES (${role}): falta ${path.relative(root, file)}; no se puede comprobar la acción. Reporta BLOCKED.`);
    }
    const r = spawnSync(bash, [file], { input: JSON.stringify(input), cwd: root, encoding: "utf8" });
    if (r.error) throw new Error(`AES (${role}): no se pudo ejecutar ${script} (${r.error.message}). Reporta BLOCKED.`);
    if (r.status === 2) throw new Error((r.stderr || "").trim() || `AES (${role}): acción bloqueada.`);
  };

  // Rutas que tocan las herramientas de archivos (una o varias, según la herramienta).
  const filesOf = (tool, args) => {
    if (args.filePath || args.file_path || args.path) return [args.filePath || args.file_path || args.path];
    const text = String(args.patchText || args.patch || "");
    if (tool.includes("patch") && text) {
      return [...text.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((m) => m[1].trim());
    }
    return [];
  };

  return {
    "tool.execute.before": async (input, output) => {
      if (!role) return;
      const args = output.args || {};
      const base = { agent_type: role, cwd: root, hook_event_name: "PreToolUse" };
      if (FILE_TOOLS.has(input.tool)) {
        for (const f of filesOf(input.tool, args)) {
          const abs = path.isAbsolute(f) ? f : path.join(root, f);
          runHook("role-guard.sh", { ...base, tool_name: "Write", tool_input: { file_path: abs } });
        }
      } else if (input.tool === "bash") {
        runHook("bash-guard.sh", { ...base, tool_name: "Bash", tool_input: { command: String(args.command || "") } });
      }
    },
    // Los procesos que lance el agente no heredan credenciales de GitHub ni de la app de AES.
    "shell.env": async (_input, output) => {
      if (!role) return;
      for (const k of Object.keys(output.env)) {
        if (/^(AES_APP_|GH_TOKEN$|GITHUB_TOKEN$|GH_ENTERPRISE_TOKEN$)/.test(k)) delete output.env[k];
      }
    },
  };
};
