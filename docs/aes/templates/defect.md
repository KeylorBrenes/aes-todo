# BUG-[NNN] — [Wrong behaviour, in one sentence]

- **Track:** T1 (moves up a track if the fix touches new behaviour or a T3 risk)
- **Severity:** Critical / High / Medium / Minor (02 §9.1)
- **Priority:** P0 / P1 / P2 / P3
- **Status:** Draft / Ready / In Progress / In Review / Accepted / Rejected
- **Story of origin:** US-[NNN] (the one that introduced or owns the behaviour)
- **Found in:** [verification of TASK-xxx, manual test, demo, CI on `main`, real use]
- **Stabilization batch:** ST-[NNN] (if applicable)
- **Is it in `main`?:** yes (released) / no (only in `dev`)
- **Route:** `dev` (ships with the next release) / hotfix from `main` (07 §9) — if it is in `main`, the human owner decides and it is recorded under "Decisions"

## Observed behaviour
[What happens today. Verbatim evidence: output, screenshot, CI run.]

## Correct behaviour (criterion)
[What should happen. One verifiable sentence. If it contradicts an accepted criterion, cite it.]

## Reproduction
1.
2.

## Reproduction check
- Type: acceptance test (`@BUG-[NNN]`) / verification command (`specs/BUG-[NNN]/BUG-[NNN].verify`)
- RED against the base: [verbatim tool output] / "no RED": [reason, approved by]

## Severity: justification
[Why it is this severity and not the next one. If it is lowered later, a recorded decision with a reason.]

## Decisions
| ID | Question | Options | Decision | Who and when | Impact |
|---|---|---|---|---|---|
