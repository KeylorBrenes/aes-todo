# Roles in OpenCode (06 §12)

Read this when `aes-bind.sh <role> <branch>` prints `opencode:<provider>/<model>`.

- **Do not use the subagent or `aes-wt.sh delegate`.** Run, **in the background** (it can take tens of minutes), and wait for its notification:
  `bash .claude/scripts/aes-oc.sh run <role> <branch> -- "<template Q1/P1/R2 with its data>"`
- The script opens the worktree, runs the role with the same contract and hooks, applies the end-of-role gate (resuming once), records the cost, puts the project language in the prompt and returns the role's report. What follows (checking commits, publishing, PR, CI, verifier) is the same as with a subagent.
- The verifier is not delegated to OpenCode: a model from another family reviews better (06 §12).

| Exit code | Meaning | What you do |
|---|---|---|
| 0 | The role finished and passed the gate | Continue |
| 3 | Gate red, or the role reported BLOCKED | Treat it as a subagent's BLOCKED report |
| 4 | OpenCode or the provider failed (balance, network, free-plan limit, incompatible version) | Tell the human; do not retry with another model without asking |
| 5 | The role finished, but the script failed afterwards: **the gate is pending** | Run the command it prints and continue with the report in `.aes/runs/` |
| 6 | Not run: servers listening on `AES_PORTS` | Ask the human to stop them |

- OpenCode does not read outside the worktree: the script copies `.aes/*-pending.md` into it when a role needs the notes.
- Free models cut long sessions off at their usage limit (HTTP 429): only for trying things out.
- `bash .claude/scripts/aes-oc.sh report <ID>`: tokens and estimated cost per role. `aes-metrics.mjs` uses the same records at close.
