// AES — Layer L2 for the roles that run in OpenCode (standard/06 §9, §12).
//
// It does not duplicate rules: it translates each OpenCode tool into Claude Code's hook format and calls
// the same scripts (.claude/hooks/role-guard.sh and bash-guard.sh). If the script blocks (exit code 2),
// the tool fails with its message and the model receives it, just as with a Claude Code hook.
//
// The role arrives in AES_ROLE, set by .claude/scripts/aes-oc.sh. Without AES_ROLE (OpenCode used by hand,
// outside AES) the plugin does nothing.
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
      throw new Error(`AES (${role}): ${path.relative(root, file)} is missing; the action cannot be checked. Report BLOCKED.`);
    }
    const r = spawnSync(bash, [file], { input: JSON.stringify(input), cwd: root, encoding: "utf8" });
    if (r.error) throw new Error(`AES (${role}): could not run ${script} (${r.error.message}). Report BLOCKED.`);
    if (r.status === 2) throw new Error((r.stderr || "").trim() || `AES (${role}): action blocked.`);
  };

  // Paths the file tools touch (one or several, depending on the tool).
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
    // Processes the agent launches do not inherit GitHub or AES app credentials.
    "shell.env": async (_input, output) => {
      if (!role) return;
      for (const k of Object.keys(output.env)) {
        if (/^(AES_APP_|GH_TOKEN$|GITHUB_TOKEN$|GH_ENTERPRISE_TOKEN$)/.test(k)) delete output.env[k];
      }
    },
  };
};
