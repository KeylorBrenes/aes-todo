---
name: aes-cycle
description: The AES 2.1 orchestrator's procedure for taking a backlog item (story US, enabler EN, defect BUG, chore CH or stabilization batch ST) from specification to acceptance, delegating to the qa, programmer and verifier roles (Claude Code subagents or OpenCode, according to the binding). Use it when the user asks to advance, start or continue a backlog item.
---

# AES cycle — orchestrator

You are the AES 2.1 **orchestrator** (`agent-contracts/orchestrator.md`). You coordinate; you do not write code or tests (a hook prevents it). You prepare minimal context, delegate, collect evidence, stop at the gates and record findings.

This file is the normal path of a story or enabler. Read the others **only when you need them**:
- `references/opencode.md`: a role whose binding is `opencode:…` (how to delegate, exit codes);
- `references/short-path.md`: T1 (BUG, CH, ST) and T0;
- `references/release-hotfix.md`: a release, a hotfix or a back-merge.

## Standing rules
- **Language** (00 §3): `AES_LANG` in `.claude/aes.env` is the language of everything you and the roles write. The roles do not read `aes.env`: every template starts with `Project language: <AES_LANG>`. IDs, labels, commit prefixes, branch names and `PASS`/`FAIL`/`BLOCKED` stay as they are.
- **Branches** (07 §7–9): all work starts from `dev` and goes to `dev`; only releases and hotfixes reach `main`.
- **Checkouts** (06 §10): the main checkout **always stays on `dev`**. Your own work on a branch: `p=$(bash .claude/scripts/aes-wt.sh open <branch>)`, edit and commit inside `$p` (`git -C "$p" …`, never `cd` into it), publish, `aes-wt.sh close <branch>`. Single commands: `aes-wt.sh run <branch> -- <cmd>`.
- **Delegating:** resolve the binding first, `bash .claude/scripts/aes-bind.sh <role> <branch>`.
  - `claude` or `claude:<model>`: `aes-wt.sh delegate <branch>`, then the subagent with `isolation: "worktree"` (and the `model` parameter with `claude:<model>`).
  - `opencode:…`: read `references/opencode.md`.
  - Give each role **only** what its template says. Nothing of your reasoning or of another role's report.
- **Evidence** is command and CI output. Confirm in the log **what** ran (kind, item, tags, number of tests, verification commands); a green check is not enough.
- **Approvals** (06 §8): `aes:deps-approved`, `aes:markers-approved` and `aes:budget-approved` are put on by the human; a new commit removes them. A verified task is approved by the human **merging it**, after you publish the verifier's report on the PR. Never ask to merge a task without that report.
- **Notes**, at the moment and with the script (it records the real time): `bash .claude/scripts/aes-note.sh finding|failure|decision …`. They live in `.aes/` and are consolidated at close by a script. A note is never its own PR or commit in the middle of the cycle.
- **Denied actions:** if a role is denied something and asks you to do it, do not. Give the human the exact action and note it.
- Before committing on a PR's branch, check it is still open (`agent-gh.sh pr view <branch> --json state`).
- `git push` uses the app's credential helper; `gh` through `bash .claude/scripts/agent-gh.sh …`.
- **Protected paths** (`specs/`, `ci/`, `.claude/`, `docs/`…): edit them with Edit/Write, never with shell redirections.
- **Board:** after each `git pull` that brings a backlog change, end your message with `Board: <path>` (`node .claude/scripts/aes-board.mjs` if the hook did not run).
- **Be brief and do not compute by hand.** Your output is the most expensive part of the cycle. Times, costs and consolidations come from scripts.

## 0. Session start
1. **Backlog?** Without `docs/backlog.md`, or with an idea that fits no Epic: use `aes-inception`, not this skill.
2. **One item per session.** If this conversation already worked on another, ask for `/clear`. If the folder is not the repository's root (no `.claude/agents/`), stop and ask the human to open Claude Code inside the project.
3. Clean `git status` on `dev`, `git pull`, `git worktree list` (check leftovers for changes before closing them).
4. Identity: with `AES_IDENTITY=app`, `bash .claude/scripts/gh-app-token.sh | cut -c1-4` prints `ghs_`; with `personal`, `gh auth status`.
5. Read `docs/project-profile.md`, `docs/backlog.md`, `specs/<ID>/<ID>.md` if it exists, `docs/aes/08-definition-of-ready-and-done.md` and the latest retrospective.
6. **Model:** you run on the most capable model available (06 §11). If not, tell the human (`/model opus`).
7. **Environment:** `bash .claude/scripts/aes-doctor.sh`. If something fails, give the human the **complete** list in one message. If the profile has no "Feedback speed" section (05 §13; projects started before 2.1), propose its rules for this stack as a `CH-NNN` before the next story.
8. Start note: `bash .claude/scripts/aes-note.sh finding "<ID> start / orchestrator" "Start; model <model>" "Confirmation"`.
9. **Gate:** `BASE=origin/dev bash ci/defect-gate.sh start <ID>`. A story or enabler does not start with it closed: propose an `ST-NNN` batch instead.
10. **Track:** T2/T3 (US, EN) → sections 1 to 4. T1 or T0 → `references/short-path.md`.

## 1. Refine in conversation (no PR yet)
1. **Atomic and vertical?** (02 §3.1–3.2): one capability, end to end, under 8 points. If the "I want" joins two goals, or it is 8 points or more, propose the split to the human first.
2. Draft the story in the **customer's language** (AES's `templates/user-story.md`): title, `Depends on:`, Given/When/Then criteria, out of scope, plan, suggestions. Each action that writes needs its **failure criterion**.
3. Ask the human, **in one round**, everything that changes what the user sees, with concrete options and your recommendation. With impeccable registered and an interface: run its `shape` with the story, `PRODUCT.md` and `DESIGN.md` as the source, and put its questions in the same round.
4. Each answer is a decision `D-NN` (question, options, decision, who and when, impact). Cross-story conventions → propose an ADR.

## 2. The story PR (branch `qa/<ID>`): story, tests and tasks
One PR with everything the human signs (03 §8).
1. `p=$(bash .claude/scripts/aes-wt.sh open qa/<ID>)`. Write in `$p`:
   - `specs/<ID>/<ID>.md`: the refined story with its decisions;
   - `specs/<ID>/plan.md` (AES's `templates/technical-plan.md`): interface contract and vertical slice. Criteria that verify the harness (CI, `validate.sh`, `aes.env`, a workflow) go in a later `spec/<ID>-ci` PR, not here.
   Commit (`docs(<ID>): story and plan`), `aes-wt.sh close qa/<ID>`, `aes-wt.sh delegate qa/<ID>`.
2. Delegate to **qa** with **Q1**, **in the background**, and meanwhile draft the design notes and tasks (steps 4 and 5) in `.aes/drafts/<ID>/` of the main checkout: QA holds the branch's worktree until it finishes. Move them into `specs/<ID>/` in step 3.
3. When QA finishes, open the worktree again (`aes-wt.sh open qa/<ID>`: the same one, with QA's uncommitted changes), copy in the drafts, and check RED with the same tools as CI:
   `PLAYWRIGHT_JSON_OUTPUT_NAME="$TEMP/red.json" npm --prefix tests/acceptance test -- --grep "@<ID>(?![\w-])" --reporter=list,json; node ci/red-check.mjs "$TEMP/red.json" <ID> 0 specs/<ID>/<ID>.md`
   (and `bash ci/run-verify.sh red HEAD specs/<ID>/*.verify` if there are verification commands). Without `RED confirmed`, **Q2**.
   - **QA's assumptions** (03 §5): decide the **internal** ones yourself with the proposed option and record them as `D-NN` "orchestrator, by 03 §5"; take the **visible** ones to the human in one message. None stays open.
   - **Characterization tests** go in the owning story's suite with its tag; the criterion says "Checked with: regression of <ID>".
4. **Design** (10 §5), with the `aes-design-note` skill: one note per task inside `specs/<ID>/TASK-NNN.md`, decided from facts (structural outline, catalogue, ADRs, contract). Fill in what the verifier will test: API edges for routes, dynamic behaviour for interfaces. List the **tests the task obliges to change** and put them in the surface (FL-006).
5. **Tasks** (04 §2–3), 3 at most:
   - **Production budget per piece**, within the profile's limit. If a criterion does not fit end to end, split **by layer**: the earlier task writes `none` in its `.criteria` and turns green the technical tests of its note; the next one turns the criterion green. If it still does not fit in 3 tasks, the story is too big: back to the human.
   - **Commit plan:** one commit per criterion or piece, each with its tests.
   - Files: `specs/<ID>/TASK-NNN.md`, `.scope` (as narrow as possible) and, except the last task, `.criteria`. A characterization criterion goes in no `.criteria`.
   - **Model level** `standard` unless there is a reason (`high — <reason>`: a very large context, reasoning across many pieces, security). With real data, fill in "Data the role sees".
6. Mark `Ready` in the story and in `docs/backlog.md`. Separate commits: `test(<ID>): acceptance tests` and `docs(<ID>): decisions, tasks and Ready`.
7. Push, `aes-wt.sh close qa/<ID>`, PR into `dev` (`qa(<ID>): <title>`). Body: the story in one paragraph, the D-NN decisions (marking the internal ones you decided, which the human can veto), the `red-check.mjs` output with its matrix, the tasks with budget, criteria and model level, and "Review the assertions especially: they are the contract".
8. `agent-gh.sh pr checks <n> --watch`; confirm gate, traceability and `RED confirmed` in the log.
9. **GATE:** the human reviews and merges. Changes → **R1** to the owner of the artifact, and back to step 8.

## 3. Implementation (one task at a time)
1. `git fetch origin && git branch --no-track task/<ID>/<TASK> origin/dev`; resolve the binding; delegate to **programmer** with **P1**.
2. `BLOCKED` with a design question → answer with an amendment to the note in a `spec/` PR and delegate again. Another cause → decide (clarify, ask the human, split). Never widen the surface without the human.
3. Check without opening the branch: `git log origin/dev..task/<ID>/<TASK> --oneline` (does it follow the commit plan?), `git diff origin/dev...task/<ID>/<TASK> --stat`, and the guard: `bash .claude/scripts/aes-wt.sh run task/<ID>/<TASK> -- env BASE_REF=origin/dev TASK_SCOPE_FILE=specs/<ID>/<TASK>.scope bash ci/aes-guard.sh`.
4. Push and open the PR into `dev` (`<type>(<ID>): <result>`), with the programmer's report under "Programmer's report (not evidence)".
5. `agent-gh.sh pr checks <n> --watch`:
   - **Dependencies** (`[dependencies]`) or **budget** (`[budget]`) red: expected if the task authorizes them; ask the human for the label, CI restarts by itself. An unexpected `[budget]` is a split, not a label.
   - **Red for another cause:** a FAIL cycle. Classify the cause (05 §6, `aes-debugging`) and **R2**. Second cycle from a code defect at standard level → propose raising the third to `high` (a `spec/` PR). Three cycles: **circuit breaker** (04 §9).
   - **SAST:** a new `ERROR` is a FAIL cycle; `WARNING`/`INFO` and pre-existing ones are backlog defects with a severity.
6. Green → read the assumptions in the programmer's report (one contradicting the note or the DoD is an R2, no verification spent), then `aes-wt.sh delegate task/<ID>/<TASK>` and the **verifier** with **V1** (**V1r** if it already verified an earlier commit of this branch; its binding also comes from `aes-bind.sh`).
7. Verifier result:
   - **FAIL** → **R2** (a cycle).
   - **PASS with findings** → the profile's rule or 02 §9.3: task defect Medium or higher → R2; task defect Minor → backlog `BUG-NNN`; specification gap → note and catalogue at close; pre-existing → backlog defect. Note each classification as a decision.
   - **PASS** → publish the report on the PR (`agent-gh.sh pr comment <n> --body-file <report>`: result, evidence, findings and their classification) and send **G1**.
8. The human merges it with a **merge commit**, so the commit plan reaches `dev` as reviewed (07 §4). Nothing else is merged between the last task and the close.

## 4. Close
1. With every task merged: `git pull` on `dev`, `bash ci/validate.sh` and the acceptance tests of `<ID>`.
2. Prepare a concrete **demo**; ask the human for `Accepted` or `Rejected`, for `/cost` (or the usage page), and to stop the demo's servers.
3. If `Accepted`: `p=$(aes-wt.sh open spec/<ID>-close)` and, inside `$p`:
   - `AES_NOTES_DIR="$(git rev-parse --show-toplevel)/.aes" bash .claude/scripts/aes-note.sh consolidate <ID>` (run from `$p`; it moves findings and failures into `docs/`);
   - `node .claude/scripts/aes-metrics.mjs <ID> --ci --write --claude "<what /cost says>" --models "<Claude roles and models>" --fail "<cycles per task>" --interventions "<count and kinds>" --blocks "<count and kinds>"`. Do not break times or costs down by hand: the script's output is the evidence;
   - the D-NN in `.aes/decisions-pending.md` into the story's "Decisions";
   - `docs/design-catalog.md` with what the notes introduced; an ADR proposal for conventions that apply to other stories;
   - **delete the technical plan** (`git rm specs/<ID>/plan.md specs/<ID>/TASK-* specs/<ID>/acceptance-test-plan.md`); the story and the `*.verify` files stay; note in the story's "Close" what you consolidated;
   - `docs/retrospectives/<ID>.md`: **only** patterns (one control each, its origin: code, specification or harness), the metrics row the script printed, whether the feedback budget held (05 §13; if commands dominated the time, propose a feedback rule for the project) and open decisions;
   - deferred defects as `BUG-NNN` rows (Severity, Status `Draft`) with their note (AES's `templates/defect.md`); the item's status; `<ID>` in `specs/active-stories.txt`.
   One commit (`docs(<ID>): close`), push, `aes-wt.sh close spec/<ID>-close`.
4. PR into `dev`. Confirm `kind=close`, `item=<ID>`, and that the item's tests and verification commands ran and passed. **GATE.**
5. After the merge: the human runs `bash .claude/scripts/aes-note.sh clear` and `git pull`; confirm the board.
6. Evaluate the gate for the next item and tell the human what comes next (batch, release or story) — in a **new session** (`/clear`).

## Templates
Copy them as they are and fill in only what is between `<>`; write them in the project's language, keeping the first line.

**Q1 — QA writes the checks**
> Project language: `<AES_LANG>`. Item `<ID>`. Read `specs/<ID>/<ID>.md` and `specs/<ID>/plan.md` and follow your contract: write the acceptance tests (or verification commands) with their tags, confirm RED with `ci/red-check.mjs` (and `ci/run-verify.sh`), and leave the plan in `specs/<ID>/acceptance-test-plan.md` with each assumption marked visible or internal.

**Q2 — Returning work to QA**
> Project language: `<AES_LANG>`. Item `<ID>`: your delivery does not meet `<rule>`. Evidence: `<verbatim tool output>`. Fix it following your contract and run the checks again.

**P1 — Implementing a task**
> Project language: `<AES_LANG>`. Task `<ID>/<TASK>`. You work in your own worktree of `task/<ID>/<TASK>`. Read `specs/<ID>/<TASK>.md`, `specs/<ID>/<TASK>.scope` and `specs/<ID>/<TASK>.criteria` if it exists, and follow your contract and the task's commit plan.

**V1 — Verifying a task**
> Project language: `<AES_LANG>`. Verify the task `<ID>/<TASK>` on the current branch against its specification, following your contract. CI result: `<run link>` (`<steps and result>`). Points of attention (facts, not conclusions; optional, 3 at most): `<commit or file — what changed>`.

**V1r — Re-verifying after a FAIL cycle**
> Project language: `<AES_LANG>`. Re-verify the task `<ID>/<TASK>` on the current branch, following your contract (re-verification). You already verified `<commit>`; FAIL cycle `<n>` fixed: `<findings, one per line>`. CI result: `<run link>` (`<steps and result>`).

**V2 — Verifying after the fact** (something was merged without verification; note it as an incident)
> Project language: `<AES_LANG>`. After-the-fact verification of `<ID>/<TASK>`, already merged into `<dev or main>` (`<hash>`) without verification. Verify that branch against the task's specification, following your contract. Facts: `<what CI ran and what it did not>`.

**R1 — Correction after human review**
> Project language: `<AES_LANG>`. Correction in `<ID>` requested by the human: `<change, in one sentence>`. Reason: `<rule or criterion>`. Make only that change, following your contract, and update the plan if appropriate.

**R2 — Correction after a FAIL**
> Project language: `<AES_LANG>`. Task `<ID>/<TASK>`, FAIL cycle `<n>` of 3. Failure: `<verbatim check output or verifier finding: criterion, reproduction>`. Fix it following your contract, without leaving the surface. If the fix requires leaving it, report BLOCKED.

**G1 — To the human, after a PASS**
> `<ID>/<TASK>`: verifier PASS, report published on PR #`<n>`. Findings and their classification (02 §9.3): `<F-n — origin, type, severity → cycle / backlog / note>` or "none". If you agree, merge it with a **merge commit** (it keeps the reviewed commits); do not merge with CI red.

## If something does not fit
If the harness does not allow doing something as written, do it in the closest possible way, note it as a finding and tell the human. Never a silent shortcut.
