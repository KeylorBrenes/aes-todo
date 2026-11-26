# Technical plan — [US-NNN]

[For the agents: orchestrator, QA, programmer and verifier (03 §1.2). The human owner does not need to read it to approve the story. It is **deleted at close**, after moving whatever has value for future stories into the design catalogue or an ADR. The acceptance tests and the verification commands are not part of the plan: they are kept.]

- **Story:** [US-NNN](US-NNN.md)
- **Structural outline used:** `aes-outline.sh <ref> <paths>` at [commit]

## Interface contract
[The observable entry point the acceptance tests are written against (05 §2.1). Omit only if the story touches no observable boundary.]

| Type | Definition |
|---|---|
| API / CLI / UI / library | [e.g. `POST /api/payments` → 201 `{id, amount, dueDate}`; 400 with `errors` per field; form `data-testid="payment-form"`] |

## Vertical slice
[Which minimal part of each layer this story needs: migration, server, interface. Nothing from other stories.]

## Tasks (3 at most, 04 §3)
| ID | Result | Criteria it turns green | Production budget | Surface | Agent |
|---|---|---|---|---|---|
| TASK-001 | [e.g. server side of AC-01 and AC-02] | `none` (technical tests of the note) | 250 | `TASK-001.scope` | programmer |
| TASK-002 | [e.g. the form] | AC-01, AC-02 | 200 | `TASK-002.scope` | programmer |

[Each task has its `TASK-NNN.md` file with the design note (`design-note.md`), its `.scope` and, except the last one, its `.criteria`.]

**Criteria that verify the harness** (CI, `validate.sh`, `aes.env`, a workflow): their changes do not go in the `qa/<ID>` PR, because they would make their own verification command pass and CI would reject the RED. They go in a `spec/<ID>-ci` PR **between** `qa/<ID>` and the first task, prepared by the orchestrator (protected paths). Indicate it here:

| Criterion | Harness files it changes | PR |
|---|---|---|
| | | `spec/<ID>-ci` |

## Technical risks and open questions

## To consolidate at close
- Design catalogue:
- ADR:
