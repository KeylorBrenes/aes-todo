# T1 and T0 (04 §10)

## T1: defect, chore or stabilization batch
A single PR for specification, checks and tasks; then the tasks and the close as in sections 3 and 4 of the skill. No new functionality: if it appears, the item moves up a track.

1. `p=$(bash .claude/scripts/aes-wt.sh open qa/<ID>)` (hotfix: `… open qa/<ID> origin/main`). Write `specs/<ID>/<ID>.md` with AES's `templates/defect.md` or `templates/stabilization-batch.md`: for each defect, severity, story of origin, correct behaviour as a `| BUG-NNN | … |` row, and reproduction. A chore carries its criterion as `| AC-01 | … |`.
2. Commit, `aes-wt.sh close qa/<ID>`, delegate to **qa** with **Q1**: each criterion gets its check (an acceptance test with the item's and the defect's tag, or a verification command `specs/<ID>/BUG-NNN.verify` or `specs/<ID>/<ID>-AC-NN.verify`) with RED confirmed. Exceptions:
   - **Flaky test** (the defect is a test): QA fixes it in its story's suite. Its check is `specs/<ID>/BUG-NNN.verify` starting with `# aes: no-red flaky test`, running those tests with `--repeat-each=<N from the profile>`; the plan lists the earlier failing runs.
   - **No RED possible:** the command starts with `# aes: no-red <reason>`, and the human approves it explicitly in the PR.
3. Tasks as in section 2 step 5 of the skill, grouped by surface; the `.criteria` lists `BUG-NNN` or `AC-NN`. A batch whose fixes are all QA's may have no tasks.
4. Mark `Ready`, open the PR (`qa(<ID>): …` into `dev`; hotfix: into `main`). **GATE:** the human approves severity, criteria and checks.
5. Implementation, close and gate: sections 3 and 4 of the skill. In a batch, a defect that is not fixed stays open and the gate stays closed.

## T0 (trivial)
1. A `spec/<ID>` PR with the task and its `.scope`; the human merges it.
2. The task with **programmer** (or **mechanic**) and **P1**; CI; a verifier only if the profile asks for it. The human merges.
3. Status in the backlog.
