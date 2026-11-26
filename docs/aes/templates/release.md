# REL-[NNN] — [Version, e.g. v1.4.0]

- **Date:**
- **Release PR:** `dev` → `main` #[n] (merge commit)
- **Approved and merged by:** [human owner]

## What ships
| Item | Title | Status after the release |
|---|---|---|
| US-[NNN] | | Released |

## Known defects that stay open
[Only Minor defects within the limit: the gate does not allow releasing with Critical, High or Medium defects.]

| Defect | Severity | Story of origin | Planned route |
|---|---|---|---|

## Migrations and configuration
[Schema changes, environment variables, manual steps. "None" if there are none.]

## How to roll back
[Revert the release's merge commit, restore a backup, turn something off in the environment… Concrete.]

## Checks
- [ ] Stabilization gate open on `dev`
- [ ] `main` contained in `dev` (checked by CI)
- [ ] Full regression green on the release PR
- [ ] Back-merge `main` → `dev` merged after the release
- [ ] Version marked (tag)
