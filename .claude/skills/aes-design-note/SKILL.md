---
name: aes-design-note
description: How the AES orchestrator writes the design note of each T2/T3 task (AES 10 §5), and how it answers a programmer's design question. Use it when splitting a story into tasks before Ready, or when a programmer ends with BLOCKED over a design question.
---

# Design note (AES)

You are the team's senior designer. The programmer will follow the note to the letter and will add nothing it does not say; the verifier will review the diff against it. What you do not write does not exist; what you write ambiguously is interpreted the easiest way.

The note is written in the project's language (`AES_LANG`).

## 1. Gather facts (not descriptions)
- The story, its criteria and the interface contract.
- `docs/design-catalog.md`: patterns in use and what has already been decided **not** to use.
- The ADRs that apply.
- The structural outline of what the story touches:
  `bash .claude/scripts/aes-outline.sh origin/dev <paths>`
  If the project uses a code graph (for example, Graphify), consult it for dependencies and impact, and count as facts **only** the relationships extracted from the code, not the inferred ones.
- If you are answering a programmer's question: their question, plus the same facts. Not their description of how the code is.

## 2. Decide level 2 with one question
For each possible pattern or abstraction (AES 10 §4):
1. What **present reason** justifies it: variants that already exist, backlog stories that ask for it or an ADR?
2. If level 1 is respected, how much would it cost to add it later?

With no present reason, or with a low cost of adding it later: **it is not used**, and it is written under "What is not done". Choosing not to use a pattern is a decision with the same weight as using it.

## 3. Write the note (template `templates/design-note.md`)
- **Pieces:** file, type or function; whether it is new or existing; **one** responsibility each.
- **Pattern:** the one chosen with its present reason, or "none" and why direct code is enough.
- **What is not done:** one line per foreseeable temptation. For example: "no interface is created for `ExpenseService`: a single implementation", "the form is not generalized for other entities", "`Program.cs` is not touched except to register the endpoint".
- **Level 1 where it is not obvious:** where the logic ends and input/output begins; which dependencies are received and through where; where this feature's data access lives; at which boundary it is validated and to which type it is converted.
- **API edges** (if the task adds or changes routes): for each prefix, what an unsupported method, an unknown route and the trailing slash return, with which body, and which fallback covers it. By default frameworks respond without the contract's body, and the verifier tests it.
- **Dynamic behaviour of the interface** (if the task has UI): one row per state transition with where focus goes, what is announced and in which live region, and whether the focus ring shows (with keyboard, with mouse or never, according to the type of element and `DESIGN.md`); which live regions are mounted from page load; whether a message reserves space; and which responses the technical tests must cover (also a success with an unexpected body). Consult the catalogue: what was already decided on another screen is cited, not redesigned. If impeccable is registered, the summary of its `shape` is the source of the states.
- **Catalogue:** if the note introduces a new pattern or a new "no", note it to update `docs/design-catalog.md` at close.

## 4. Review it before publishing it
- Does each piece have **one** responsibility, named without "and"?
- Is there any pattern without a present reason? Remove it.
- Does "what is not done" cover what a junior programmer would add "just in case"?
- Does the note fit in the task's change surface? If it requires touching more, the surface or the split into tasks is wrong.
- Is there any decision the programmer would have to improvise and the verifier is going to test (focus, announcements, the body of an error, an unexpected response)? Write it: each one missing is a likely FAIL cycle.
- Does it contradict the catalogue or an ADR? Then it is a new decision: record it (D-NN) or propose an ADR.

## What this skill does not do
It does not decide requirements (they are the human's), it does not read implementations to decide, and it does not replace the verifier: the verifier checks that the code follows the note.
