# Agent failure log — [Project]

Failures observed in agents and the controls added to prevent them (AES 09). Observable facts are recorded, not judgements about the model.

## Active patterns
| Pattern | Entries | Control applied | Layer | Status |
|---|---|---|---|---|
| | | | L1 / L2 / L3 / template / skill / AGENTS.md | Proposed / Approved / Verified |

---

## FL-[NNN] — YYYY-MM-DD
- **Agent / harness / model:**
- **Task / story:**
- **Symptom:** [what the agent did]
- **Detected by:** [CI, guard, verifier, human review]
- **Probable cause:** [what was missing in the task, the context or the controls]
- **Proposed control:** [in order of strength: CI → hook → permission → template or skill → line in AGENTS.md]
- **Approved by / date:**
- **Verified in:** [later task where it did not repeat]

### Example

## FL-007 — 2026-11-02
- **Agent / harness / model:** programmer / OpenCode / [model]
- **Task / story:** TASK-014 (US-005)
- **Symptom:** added pagination nobody asked for to the notifications list.
- **Detected by:** verifier ("functionality nobody asked for" signal).
- **Probable cause:** the task had no explicit "Out of scope".
- **Proposed control:** the task DoR requires a non-empty "Out of scope" in T2/T3.
- **Approved by / date:** human owner, 2026-11-02.
- **Verified in:** TASK-019, no recurrence.
