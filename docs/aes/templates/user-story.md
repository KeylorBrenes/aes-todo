# US-[NNN] — As a [type of user], I want [capability], so that [benefit]

[The story is for the human owner and is kept. It is written in the customer's language: what is achieved and how it is checked, with no tables, classes, endpoints or patterns (03 §1). The technical part goes in the technical plan (`technical-plan.md`), which is deleted at close.
For enablers, the title is "EN-[NNN] — For [goal], we need [technical capability]". For defects, chores and stabilization batches use `defect.md` and `stabilization-batch.md`.]

- **Depends on:** US-[MMM] / —
- **Epic:** EPIC-[NNN]
- **Track:** T2 / T3
- **Status:** Draft / Ready / In Progress / In Review / Blocked / Ready for Acceptance / Accepted / Released / Rejected / Deferred
- **Priority:** P0 / P1 / P2 / P3
- **Story points:** 1 / 2 / 3 / 5 [8 or more: split before refining, 02 §3.1]
- **Risk:** Low / Medium / High / Critical
- **Product approver:**

## Context and rules
[In business terms: why it matters and which rules apply.]

## Acceptance criteria
[Given / When / Then, in the user's language. Every action that saves, edits, deletes or sends has a failure criterion: what the user sees if it could not be done and what clears it (03 §3).]

| ID | Given | When | Then | Checked with |
|---|---|---|---|---|
| AC-01 | I am a visitor | I sign up with a valid email and a password of at least 8 characters | my account is created and I enter the app signed in | Acceptance test |
| AC-02 | | | | Regression of US-[MMM] (the behaviour already exists, 05 §2.4) |

## Out of scope
[Mandatory and non-empty. What someone could expect from this story and is not done here, with the story that will cover it if there is one.]

## Plan
[How it will be built, told as to a customer: what the user will be able to do at the end of each step. No technical details.]

## Orchestrator's suggestions
[What it considers the best path and why; which alternatives it ruled out. In the customer's language.]

## Decisions
[Each ambiguity resolved and each QA assumption turned into contract (03 §8). It goes in the same PR that uses it. No assumption stays open when moving to `Ready`.]

| ID | Question | Options | Decision | Who and when | Impact |
|---|---|---|---|---|---|
| D-01 | | | | | New/changed criterion, ADR or "none" |

## Risks

## Close
- Human acceptance (date):
- Defects recorded (ID and severity):
- What was consolidated from the technical plan (design catalogue, ADR):

## Change history
| Date | Change | Reason | Approver |
|---|---|---|---|
