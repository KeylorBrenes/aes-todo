# Design note — [US-NNN] / [TASK-NNN]

[Written by the orchestrator (10 §5) from facts: the story, the interface contract, the ADRs, `docs/design-catalog.md` and the tool-generated structural outline. It goes inside the task's specification.]

## Pieces
| Piece (file / type / function) | New or existing | Responsibility (one) |
|---|---|---|
| | | |

## Pattern (level 2)
- **Used:** [pattern] — present reason: [real variants, backlog stories or ADR]
- or **None**: [why direct code is enough]

## What is not done
- No [interface / layer / abstraction / generalization] is created for [X]: [reason]
- [Module] is not touched: [reason]

## Level 1 where it is not obvious
[Where the logic ends and input/output begins; which dependencies are received as parameters; where this feature's data access lives.]

## API edges (only if the task adds or changes routes)
[What the framework decides by default and the contract must fix. One row per new prefix or route.]

| Route or prefix | Method not allowed | Unknown route and trailing slash | Error body | What covers it (fallback, middleware) |
|---|---|---|---|---|
| | [405 + uniform body] | [404 + uniform body; `/prefix/` included] | [contract shape] | |

## Dynamic behaviour of the interface (only if the task has UI)
[The verifier checks this with keyboard, screen reader and mouse. What is not stated here the programmer will decide, and each difference from what is expected will be a FAIL cycle.]

| State transition (what causes it) | Where focus goes | What is announced and in which live region | Visible focus ring |
|---|---|---|---|
| [initial load] | | | |
| [successful action] | [control / status element with `tabIndex={-1}` / does not move] | | [yes with keyboard and mouse / keyboard only (`:focus-visible`) / no: non-interactive element] |
| [failed action] | | | |

- **Live regions:** [which are mounted from page load and which are inserted; a single `role="status"` per region; an `alert` contains no controls].
- **Focus ring by element type** according to `DESIGN.md`: [controls / status elements focused programmatically].
- **Reserved space:** [if a message appears and disappears, whether it takes up space when empty].
- **Responses the technical tests must cover:** [success, server error, network down, success with an unexpected or non-JSON body].

## Does the design catalogue change?
No / Yes: [what is added at close]
