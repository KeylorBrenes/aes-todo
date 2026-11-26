# Backlog — [Project]

Single source of truth for the backlog (AES 02 §11). Views (HTML board, GitHub Projects, Trello…) are generated from here, in one direction only. Changes go through pull requests.

**Vision:** [one or two sentences: what problem the product solves and for whom]
**Stack:** [e.g. .NET 10 + EF Core + SQLite, React + TypeScript + Vite]

## Releases
| Release | Goal (what the user can already do) | Status |
|---|---|---|
| REL-001 | [e.g. record their expenses and see how much they have spent this month] | In progress |
| REL-002 | [e.g. organize expenses by category] | Planned |

Only the release in progress is committed; the next ones are a forecast (AES 02 §12).

## Items
| ID | Type | Epic | Title | Depends on | Points | Priority | Release | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| EN-001 | Enabler | — | For the stories to be testable end to end, we need the app running with database, API and web | — | 3 | P0 | REL-001 | — | Draft |
| US-001 | Story | Record expenses | As a user, I want to record an expense, so that I know where my money goes | EN-001 | 3 | P1 | REL-001 | — | Draft |
| US-002 | Story | Review expenses | As a user, I want to see this month's expenses, so that I know how much I have spent | US-001 | 2 | P1 | REL-001 | — | Draft |
| US-003 | Story | Record expenses | As a user, I want to assign a category to an expense, so that I know what kind of things I spend most on | US-001 | 2 | P2 | REL-002 | — | Draft |

## Epics
| Epic | What the user does |
|---|---|
| Record expenses | [one sentence] |
| Review expenses | [one sentence] |

## Notes
[Optional: one line per item with the expected value or a risk, while it is in Draft. The detail goes in `specs/<ID>/` when its turn comes.]
