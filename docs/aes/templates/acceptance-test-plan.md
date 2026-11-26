# Acceptance test plan — [US/EN/BUG/ST]-[NNN]

- **Story version:**
- **Track:** T1 / T2 / T3
- **Prepared by:** QA / test designer
- **Status:** Draft / Approved / Protected

## Contractual source
[Link or exact reference to the story, the approved criteria and the interface contract.]

## Traceability
Each test carries the item's and the criterion's tags (`@US-[NNN]`, `@US-[NNN]-AC-NN`) and the criterion ID at the start of the title. Every test derives from an approved criterion. The criterion → test matrix is not written by hand: it is the output of the RED tool, pasted under "Confirmed RED" (05 §2.2).

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
[Everything that had to be assumed because the contract does not say it. **Visible** if it changes what the user sees or does (behaviour, data, text, accessibility): the human decides it. **Internal** if it only changes how the test checks it (a selector, a timing, how a result is observed): the orchestrator decides it and lists it in the PR, where the human can veto it (03 §5). Each one becomes a decision D-NN of the story. None stays open.]

| # | Assumption | Visible / internal | Affected test(s) | Proposed option | Decision (D-NN) |
|---|---|---|---|---|---|

## Confirmed RED
Run against the base branch before implementing, checked by the tool CI uses: **every** new test ran and failed, each for the expected reason. The tool's output includes the criterion → test matrix with each failure's first line: paste it verbatim and mark any test whose failure is not the expected one.

- Command:
- RED tool output (verbatim, with the matrix):
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
