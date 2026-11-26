# Independent verification report — US/TASK-[ID]

- **Verifier (harness/model):**
- **New, read-only session:** Yes / No
- **Date:**
- **Exact commit/diff:**
- **Specification and version:**
- **Track:**
- **Result:** PASS / FAIL / BLOCKED

## Design
- Does the diff follow the design note (pieces, responsibilities, pattern, what is not done)?
- Level-1 symptoms (AES 10 §3)? List the ones found with file and line.

## Points of attention received
[Facts the orchestrator pointed out. They are checked as hypotheses, not accepted as conclusions.]

## Scope verified
[Story, tasks, criteria, interface contract and paths reviewed.]

## Re-run evidence
| Criterion / control | Method (command or tool) | Result | Evidence (output, screenshot, artifact) |
|---|---|---|---|
| Visible acceptance | | | |
| Holdout acceptance | | | |
| Unit/integration | | | |
| Lint/types/security | | | |

## CI guard
- Change surface respected: Yes / No (files outside):
- Protected paths intact: Yes / No
- Cheating markers: None / [list and justification]
- New dependencies:

## Drift signals (Beck)
| Signal | Present? | Evidence |
|---|---|---|
| Loops or unnecessary repetitive code | | |
| Functionality nobody asked for | | |
| Tests disabled, deleted or weakened | | |

## Agentic manual test
[How the servers were started (with the tool that stops them at the end), which flows were exercised, **with data different from the tests'**, screenshots and verbatim output. Without a manual test, when the track requires one, the result is BLOCKED.]

## Findings
Each claim was checked at its source (00 §7): versioned content with `git show`/`git cat-file`, behaviour in the code or by running it.

| ID | Origin | Type | Proposed severity | Finding | Reproduction/evidence | Criterion or rule broken |
|---|---|---|---|---|---|---|
| F-1 | From the task / pre-existing | Defect / Specification gap | Critical / High / Medium / Minor | | | |

- **Origin.** "From the task": about what the task adds. "Pre-existing": behaviour already accepted or older → a backlog defect with a severity.
- **Type.** "Defect": the code breaks something written (criterion, design note, DoD, `DESIGN.md`, ADR); cite the rule. "Specification gap": the code does something reasonable that nothing written decides; propose what the note or the catalogue should say.
- What is done with each one is decided by the rule in 02 §9.3, not by the verifier.

## Commits
[Do they separate structural and behavioural changes? Does any `struct:` change behaviour?]

## Out-of-scope changes
[State none or list them.]

## Environment at the end
[No verifier servers or processes left listening (06 §10).]

## Risks and aspects not verified

## Conclusion
[Justify PASS/FAIL/BLOCKED. PASS only if every mandatory criterion has enough re-run evidence. For holdout failures, the message to the programmer includes only the criterion ID and the observed behaviour.]
