# Acceptance test plan — [US/EN/BUG/ST]-[NNN]

- **Story version:**
- **Track:** T1 / T2 / T3
- **Prepared by:** QA / test designer
- **Status:** Draft / Approved / Protected

## Contractual source
[Link or exact reference to the story, the approved criteria and the interface contract.]

## Traceability matrix
Each test carries the item's and the criterion's tags (`@US-[NNN]`, `@US-[NNN]-AC-NN`) and the criterion ID at the start of the title. Every test derives from an approved criterion.

| Criterion | Test (title) | Type | Visible/holdout | Automated/manual | Expected evidence |
|---|---|---|---|---|---|

## Characterization tests
[Criteria whose behaviour already exists: they cannot show RED. They live in the owning story's suite, with its tag, and run in the regression suite (05 §2.4). Omit if there are none.]

| New criterion | Test | Owning suite / tag | Reason |
|---|---|---|---|

## Scenarios
For each scenario document the preconditions, synthetic data, action (through the interface contract), expected result and clean-up.

Isolation (05 §2.5): each test creates its data and finds it by a marker of its own; it does not compare global counts or totals; it does not depend on order or on a serial mode.

## Negative and boundary cases

## Security/authorization

## Relevant regression

## Automation and environment
[Framework, commands, dependencies and configuration.]

## Assumptions that need a decision
[Everything that had to be assumed because the contract does not say it: type of control, format, behaviour in an edge case. The orchestrator takes them to the human before `Ready`; each answer is a decision D-NN of the story. None stays open.]

| # | Assumption | Affected test(s) | Decision (D-NN) |
|---|---|---|---|

## Confirmed RED
Run against the base branch before implementing, checked by the tool CI uses: **every** new test ran and failed, each for the expected reason.

| Scenario | Result against base | Reason for the failure | Is it the expected reason? |
|---|---|---|---|
| | FAIL | [e.g. 404 on `/api/notifications`] | Yes |

- Command:
- RED tool output (verbatim):
- Base commit:
- Artifact/output:

## Protection
- Location of the visible suite:
- Location of the holdout suite (not accessible to the programmer):
- Trusted commit/branch:
- Protection mechanism (L3):
- Who can approve changes:

## Approval
- QA:
- Human owner who approved the criteria **and the tests**:
- Baseline date/commit:
