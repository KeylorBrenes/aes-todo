# 08 — Definition of Ready and Definition of Done

Projects SHOULD copy these checklists into their repository (01 §2), so that agents have them without leaving it.

## 1. Definition of Ready (DoR) — User story or enabler (T2/T3)

A story can become `Ready` when:

- [ ] **the stabilization gate is open**: there are no open defects of Critical, High or Medium severity, and the Minor ones do not exceed the profile's limit (02 §9);
- [ ] the title has the format of its type ("As a… I want… so that…" for stories; "For…, we need…" for enablers) and declares `Depends on:` (02 §3);
- [ ] the story is **atomic** (one capability that can be demonstrated on its own) and a **vertical slice** (02 §3.1–3.2), with fewer than 8 points;
- [ ] the story is written in customer language; the technical detail is in the technical plan (03 §1);
- [ ] scope and relevant exclusions are defined;
- [ ] acceptance criteria are observable and verifiable;
- [ ] every action that writes has a failure criterion (03 §3);
- [ ] material ambiguities are resolved and **recorded as decisions** (03 §8);
- [ ] **no QA assumption remains open**: each one is contract or was rejected (03 §5);
- [ ] relevant dependencies and risks are identified;
- [ ] priority, story points and track are assigned;
- [ ] there is an acceptance and testing strategy;
- [ ] the necessary architectural decisions are approved; conventions that apply to more than one story are in an ADR;
- [ ] the interface contract is defined when the story touches an observable boundary;
- [ ] the acceptance suite is written, approved by the human owner and protected;
- [ ] each test carries the story's ID and its criterion's ID, and derives from an approved criterion (03 §6);
- [ ] **RED confirmed** by a tool: every new test ran and failed for the expected reason (05 §2.2), except the characterization tests, which are in the regression suite of the story that owns them (05 §2.4);
- [ ] holdout tests exist when the track is T3 (or the profile requires them);
- [ ] "Out of scope" is not empty;
- [ ] the tasks are written, with a change surface, the criteria they turn green and their model level, without inventing requirements;
- [ ] each task has its design note (10 §5), decided from the design catalogue and the structural outline;
- [ ] the story has **at most 3 tasks** (04 §3); otherwise, it was split.

If a box does not apply, it can be marked `N/A` with a justification. A story must not be forced into `Ready` because of planning pressure.

## 2. Definition of Ready — T1 (defect, chore, stabilization batch)

- [ ] the item is in the backlog, with a severity and the story of origin if it is a defect;
- [ ] the criterion says which behaviour is correct;
- [ ] the reproduction check exists (a protected test or a verification command) and fails against the base for the expected reason, or the item declares "no RED" with a reason and approval;
- [ ] the change surface is published;
- [ ] the human owner approved the specification PR.

For T0 the task is enough (§3).

## 3. Definition of Ready — Task

A task can start when:

- [ ] it belongs to an approved item in `Ready`;
- [ ] its branch starts from `dev` (or from `main`, for a hotfix: 07 §9);
- [ ] it has one concrete main result;
- [ ] scope, exclusions and constraints are clear;
- [ ] the change surface and the list of criteria it turns green are published on the protected branch (the item's last task needs no list: it runs the whole item);
- [ ] if it introduces a state, it lists the transitions that create it and clear it;
- [ ] dependencies/contracts are known;
- [ ] the agent's permissions are defined;
- [ ] the exact validation commands and the affected regression tests are listed;
- [ ] the diff budget is estimated separately for production and tests;
- [ ] its model level is set (standard, or a higher level with its reason: 06 §12.1);
- [ ] the completion condition is defined;
- [ ] the necessary context is available, and the environment check passes (`aes-doctor` in the reference implementation).

## 4. Definition of Done — Task

A task is technically done when:

- [ ] it meets the specified result;
- [ ] the test baseline was recorded at the start of the session;
- [ ] the change is within the change surface;
- [ ] the design follows the design note and shows no level-1 symptoms (10 §3);
- [ ] the relevant tests were added/updated and run;
- [ ] the required lint, types and analysis pass;
- [ ] the commits separate structural and behavioural changes;
- [ ] the CI guard reports no alerts, or each alert has a justification and the approval of an authorized person;
- [ ] CI ran what it had to (confirmed in the log: criteria, number of tests);
- [ ] the diff was inspected and there are no unrelated changes;
- [ ] no secrets, temporary artifacts or unapproved dependencies were introduced;
- [ ] no servers, processes or data of the role remain in the environment (06 §10);
- [ ] the report was delivered with executed evidence and known blockers;
- [ ] the verifier issued `PASS` **before merging**, the findings were classified by origin, type and severity (02 §9.3), and the findings outside the task are recorded as defects with a severity.

The task moves to review; the programmer does not mark it as accepted.

## 5. Definition of Done — User story or enabler

A story can become `Ready for Acceptance` when:

- [ ] all its tasks are technically done and merged;
- [ ] every acceptance criterion has PASS evidence or an approved formal exception;
- [ ] the required unit, integration, contract, E2E and regression tests pass;
- [ ] the applicable static and security controls pass;
- [ ] the holdout tests pass, when they exist;
- [ ] the independent verifier re-ran the validations and issues `PASS`;
- [ ] there is evidence of the agentic manual test when the track requires it (05 §11);
- [ ] no Critical or blocking defects are known;
- [ ] every finding that was not fixed is in the backlog as a defect, with a severity, story of origin and criterion (02 §9);
- [ ] affected documentation/ADRs and the design catalogue (10 §6) are updated with what the technical plan had of future value, and the technical plan was deleted (03 §1.2);
- [ ] the backlog views are regenerated (02 §11);
- [ ] relevant existing behaviour did not regress;
- [ ] the result can be tested in an appropriate environment.

After that:

- visible or user-relevant features go through human acceptance according to the profile; once accepted, the story stays in `dev` until the release (07 §8);
- in T3, the human owner reviews the code in the risk areas (00 §8);
- the human owner issues `Accepted` or `Rejected`;
- only then is the story considered accepted;
- the close adds the story to the main branch's regression suite, and the close's CI confirms that its tests ran and passed;
- in T2/T3, the orchestrator runs the compound retrospective (09 §3) and records the item's metrics (09 §6);
- before moving on to the next story the stabilization gate is evaluated: if it is closed, the next thing is a stabilization batch (02 §9.4).

A `BLOCKED` or `NOT RUN` result, or a test skipped without justification, is not equivalent to `PASS`.

## 6. Definition of Done — Stabilization batch

- [ ] each defect in the batch has its check green, run by CI and by the verifier;
- [ ] the defects that were not fixed stay open, with the reason;
- [ ] the batch's checks are in the main branch's regression suite;
- [ ] the human owner accepted the batch;
- [ ] the stabilization gate was evaluated again.

## 7. Definition of Done — Hotfix

- [ ] it meets the DoD of a T1, with all its branches started from `main` and merged into `main`;
- [ ] the hotfix route is a decision recorded in the defect;
- [ ] the back-merge from `main` to `dev` is merged, with a merge commit and `dev`'s regression suite green;
- [ ] the defect is `Released`.

## 8. Definition of Done — Release

- [ ] the release notes are written (items, known defects, rollback);
- [ ] the stabilization gate is open on `dev`;
- [ ] `main` is contained in `dev`, checked by CI;
- [ ] the full regression suite passes on the release PR;
- [ ] the human owner approved and merged the PR with a merge commit;
- [ ] the included items are `Released` and the version is marked;
- [ ] the back-merge from `main` to `dev` is merged.

## 9. Project Definition of Done

The project can be declared ready for a release when the release, security, migration, documentation, recovery and approval gates defined in the profile are met. All stories being `Accepted` is not enough if there are still unresolved release risks or open defects above what the profile allows to release.
