# Release, hotfix and back-merge (07 §8–9)

## Release (`dev` → `main`)
1. `BASE=origin/dev bash ci/defect-gate.sh release ""` gives OK, and `git merge-base --is-ancestor origin/main origin/dev` is true. If not, first the back-merge or the stabilization batch.
2. `p=$(aes-wt.sh open spec/REL-NNN)`: `docs/releases/REL-NNN.md` (AES's `templates/release.md`) and the items that ship marked `Released`. PR into `dev`; the human merges it.
3. The release PR: `agent-gh.sh pr create --base main --head dev --title "release: REL-NNN"`, notes in the body. Confirm gate, "main contained in dev" and full regression in the log.
4. **GATE:** the human merges it with a **merge commit** (not squash) and marks the version.
5. Immediately, the back-merge.

## Hotfix
A defect already in `main` whose route the human decided is a hotfix (recorded in the defect). It is the T1 path with these differences: every branch starts from `origin/main` (`aes-wt.sh open <branch> origin/main`, `git branch --no-track <branch> origin/main`), every PR goes to `--base main`, and the gate and the surface are read from `main`. Only a `BUG-NNN` can go this way.

## Back-merge, after each merge into `main`
1. `agent-gh.sh pr create --base dev --head main --title "chore: back-merge main → dev"`.
2. Conflicts: do not resolve them; tell the human which files (resolving them is changing code in `dev`, which no role is assigned).
3. Confirm `dev`'s regression. **GATE:** the human merges it with a **merge commit**.
