# Project profile — [Project name]

- **AES version:** 2.0.0
- **Project language (`AES_LANG`):** en / es — language of the project's artifacts (stories, plans, reports, backlog, board)
- **Product owner / human approver:** [role/person]
- **Repository:** [URL]
- **Branches (07 §7):** `main` (released) and `dev` (integrated), both protected; short work branches from `dev`, hotfixes from `main`
- **Release:** who approves, how the version is marked (e.g. tag `vX.Y.Z`), where the notes are published (`docs/releases/`)
- **Local copy of the DoR/DoD:** [e.g. `docs/aes/08-definition-of-ready-and-done.md`, from AES 2.0.0]

## Roles: harness and model
The actual model of each run is recorded in the metrics (09 §6); if it differs from this table, it is noted.

| Role | Harness | Model | Invocation | Identity it publishes with | Provider and data terms (06 §12) |
|---|---|---|---|---|---|
| Orchestrator (most capable model available, 06 §11) | | | | | |
| QA | | | | | |
| Programmer | | | | | |
| Mechanic (optional) | | | | | |
| Verifier (a different model family from the programmer's, 06 §12) | | | | | |

Example from the reference implementation: orchestrator in Claude Code (Opus); QA, programmer and mechanic in OpenCode with `deepseek/deepseek-flash`, delegated with `.claude/scripts/aes-oc.sh` (binding in `.claude/aes.env`); verifier as a Claude Code subagent (Sonnet).

### Model levels per task (06 §12.1)
| Level | When it is used | Programmer | Verifier | Provider and data terms |
|---|---|---|---|---|
| standard | By default | [binding] | [binding] | |
| high | [very large context, reasoning across many pieces, two FAIL cycles caused by code defects] | [binding] | [binding] | |

[If at some level the programmer and the verifier end up in the same model family, note it here as a gap.]

Control gaps of the roles in another harness (06 §12, point 3):

## Product and context
- Goal:
- Users:
- Constraints:
- Environments:

## Stack
- Language and version:
- Framework and version:
- Database:
- Infrastructure/deployment:
- Integrations:

## Architecture and conventions
- Important directories/modules:
- Existing patterns that must be respected:
- Contracts and APIs:
- ADRs:
- Compatibility rules:

## Backlog
- Tool / location: `docs/backlog.md` (02 §11)
- Releases: defined at inception (01 §2, 02 §12)
- ID prefixes: stories `US-`, enablers `EN-`, defects `BUG-`, chores `CH-`, batches `ST-`, spikes `SP-`
- Priority scale:
- Story point scale: Fibonacci 1, 2, 3, 5, 8, 13
- Statuses:
- Own criteria for classifying tracks T0–T3 (if they differ from 02 §8):

## Skills and tools (06 §6.2)
| Skill / tool | Type (technique / tool) | Origin and version | License | Reviewed by | Roles |
|---|---|---|---|---|---|
| aes-debugging | Technique | AES vX.Y.Z | | | Programmer, mechanic |
| aes-inception | Technique | AES vX.Y.Z | | | Orchestrator |
| impeccable (optional) | Technique + tool | vX.Y.Z (`docs/aes/skills.lock`) | Apache-2.0 | | Orchestrator, programmer, verifier |
| archify (optional) | Tool | vX.Y.Z (`docs/aes/skills.lock`) | MIT | | Orchestrator |

- Static security analysis in CI (05 §7): tool, rules and which severity blocks:
- Interface detector in CI (05 §7): tool, and which rules block (at first, none: it only notes):
- Network calls a skill does not allow turning off (06 §6.2): which, what it sends, when it is used:

## Design (10)
- Design catalogue: `docs/design-catalog.md`
- Structural outline tool (files and public signatures):
- Level-1 rules covered by linters in CI (tool and rule):
- Documented exceptions to level 1:

## Defects and stabilization gate (02 §9)
- Severity scale: Critical / High / Medium / Minor (own adjustments, if any):
- Limit of open Minor defects (5 by default):
- Where the gate is implemented (CI, L3):
- Standing rule for findings after a verifier PASS (02 §9.3), e.g. "what the task adds is fixed before integrating; the rest goes to the backlog with a severity":
- Failure-free runs required to consider a fixed test stable (05 §6):

## Quality and tests
- Unit tests (command):
- Integration tests (command):
- E2E / acceptance (command, with a filter per story):
- Lint / format:
- Types / static analysis:
- Security / dependencies:
- Justified thresholds:
- Test map generation (tool or method):
- Proportion of holdout tests:
- Indicative diff budget per task (production / tests):
- Agentic manual testing tool (Playwright, curl, etc.):
- Tool that starts and stops servers (06 §10) and the project's ports:
- Tool that checks RED (05 §2.2):
- Verification commands per item (05 §12): location and convention:
- Environment check (01 §2.3, item 10): command and what it checks:
- Dependency audit policy (e.g. `npm audit`, `dotnet list package --vulnerable`):

## Layered controls (06 §9)
| Control | L1 — Harness | L2 — Hooks | L3 — Outside the agent |
|---|---|---|---|
| Protected acceptance suite | | | |
| Inaccessible holdout tests | | | |
| Change surface | | | |
| Protected agent/CI configuration | | | |
| Do not finish with red tests | | | |
| Cheating detector | | | |
| RED confirmed by a tool | | | |
| CI per criterion and per phase | | | |
| Stabilization gate | | | |
| Approvals in CI check who (labels) | | | |
| Verifier PASS before integrating | | | |
| No servers or processes between roles | | | |
| Denied actions are not delegated | | | |
| Writes outside the repository (isolation) | | | |

## Agent permissions and operation
- Paths the programmer can edit:
- Protected paths:
- Location of the holdout tests:
- Operations that require approval:
- Exposed MCP/CLI:
- Installed skills and their origin:
- Secrets management:
- Branch/worktree strategy:
- Circuit breaker threshold (≤ 3):
- Orchestrator's notes during the cycle (location and script):

## Risk and release
- Risk classification:
- High/Critical controls (T3):
- Migrations/rollback:
- Deployment approval:

## Harness improvement
- Location of the failure log: `docs/agent-failure-log.md`
- Location of the findings and metrics log: `docs/harness-findings.md`
- Compound retrospective frequency:

## AES exceptions
| Rule | Reason | Risk | Mitigation | Approver | Review/expiry |
|---|---|---|---|---|---|
