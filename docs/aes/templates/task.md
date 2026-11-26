# TASK-[NNN] — [Concrete result]

- **Story/Enabler/Bug/Batch:** US-[NNN]
- **Track:** T0 / T1 / T2 / T3
- **Status:** Ready / In Progress / In Review / Blocked / Done
- **Assigned agent:** programmer / mechanic
- **Model level:** standard / high — [reason] / [a concrete binding, e.g. `opencode:deepseek/deepseek-flash` or `claude:opus`] (06 §12.1)
- **Data the role sees:** code only / [real data: which, and whether the provider of the chosen level may receive it] (06 §12)
- **Risk:** Low / Medium / High / Critical
- **Accumulated FAIL cycles:** 0 / 3 (circuit breaker on reaching 3)

## Goal and expected result
[One main, observable result.]

## Scope
[What must change.]

## Out of scope
[What must not change. Mandatory and non-empty in T2/T3. Name nearby features that could be implemented "for convenience".]

## Criteria it turns green
[Criterion or defect IDs. Published on the protected branch as `specs/US-[NNN]/TASK-[NNN].criteria`, one per line (`AC-03`, `BUG-012`). The task's CI runs only those plus the regression suite. The item's **last** task has no such file: it runs the whole item. A criterion verified by another story's regression (characterization) is not listed.]

## Technical context
[Components, known files, conventions, ADRs.]

## Change surface
Published on the protected branch as `specs/US-[NNN]/TASK-[NNN].scope` (one glob per line). Any file outside this list makes CI fail.

```
src/[module]/**
tests/unit/[module]/**
```

## Constraints and permissions
[Additional protected paths, authorized dependencies, operations that require approval.]

## Design note
[T2/T3: a copy of or link to the note (template `design-note.md`). The programmer adds no patterns, abstractions or pieces the note does not contemplate.]

## States it introduces
[If the task creates a state (error, loading, editing, confirmation): what creates it and which transitions clear it. Omit if not applicable.]

## Dependencies

## Exact validation commands
```
[the module's unit test command]
[acceptance test command filtered by US-NNN]
[lint] && [typecheck]
```

## Affected regression tests (test map)
[Existing test files this change could break.]

## Indicative diff budget
- Production: ~N lines
- Tests: ~M lines
[The deviation that requires justification is the production one.]

## Completion condition
[Which evidence allows moving to review.]

## Execution report
- Initial baseline (tests that were already failing):
- Changes made:
- Commits (`struct:` / `feat:` / `fix:` / `test:`):
- Tests run and results (captured output, not a summary):
- Commands and environment:
- CI guard alerts and their justification:
- Assumptions/decisions:
- Deviations/blocks:
- Pending risks:
- Clean environment at the end (no servers or processes left by the role):
- Diff/commit reference:
