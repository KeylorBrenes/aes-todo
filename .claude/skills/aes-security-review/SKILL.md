---
name: aes-security-review
description: Static security review (SAST, OWASP/CWE rules) of what an AES task changes. Use it before delivering a task that touches input, authentication, authorization, personal data, queries, files or secrets, when CI flags a security finding, or when classifying security findings as defects.
---

# Static security review (AES)

A **tool** skill (AES 06 §6.2): the control is CI's SAST step (AES 05 §7). This skill is for running it earlier, understanding the findings and deciding what to do with each one. Reference tool: [Semgrep](https://semgrep.dev/) with OWASP Top 10 rules. The profile can use an equivalent one.

## 1. Run it on what the task changes
```bash
base=$(bash .claude/scripts/aes-base.sh)          # origin/dev, or origin/main in a hotfix
semgrep scan --config p/owasp-top-ten --baseline-commit "$(git merge-base "$base" HEAD)" --metrics=off
```
`--baseline-commit` shows only the **new** findings relative to the base. Without it you would also see the pre-existing ones, which are not your task's.

## 2. Classify each finding
| Case | What you do |
|---|---|
| **True, in code the task adds or changes** | You fix it inside the surface. If it is of high severity, CI will fail until it is fixed (a `FAIL` cycle) |
| **True, pre-existing** (the task did not introduce it) | You do not fix it: it is outside your task. You report it with a proposed severity so the orchestrator records it as a defect |
| **False positive** | Do not suppress it yourself: a suppression is a guard marker and requires human approval. Report it with the reason |

A finding is true if the data that reaches the dangerous instruction can come from outside (request, file, environment variable) without going through a validation or an escape that neutralizes it. Follow the data back to its origin before deciding.

## 3. Proposed severity (AES 02 §9.1)
| Semgrep | Proposed AES severity |
|---|---|
| `ERROR` reachable from outside, which exposes data, allows running code or bypasses authentication or authorization | **Critical** |
| `ERROR` | **High** |
| `WARNING` | **Medium** |
| `INFO` | **Minor** |

It is a proposal: the orchestrator presents it and the human confirms it.

## 4. Usual fixes (without inventing your own mechanisms)
- **Injection** (SQL, commands, paths): parameterized queries or the ORM; never concatenate input into a query, a command or a path.
- **XSS:** let the framework escape; do not use `dangerouslySetInnerHTML`, `innerHTML` or `Html.Raw` with input data.
- **Secrets:** outside the code, in the environment's configuration (level 1, AES 10 §3).
- **Authorization:** checked on the server, on every operation on a resource, not only in the UI.
- **Cryptography:** the framework's primitives or an established library's; never your own.

## In the report
The command run and its real output, and a table of findings: rule, file and line, true or false, from the task or pre-existing, proposed severity and what you did. In the project's language (`AES_LANG`).
