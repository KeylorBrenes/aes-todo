---
name: aes-inception
description: AES inception (standard/01 §2). The orchestrator interviews the product owner by topic, in short blocks of concrete questions, until the idea is clear, and produces the brief, the complete but shallow backlog with Epics and releases, the initial architecture, the stack ADR, the visual direction if there is an interface and EN-001 (walking skeleton), in a single PR. Use it when the project has no docs/backlog.md, or for a mini-inception when an idea arrives that does not fit in the backlog.
---

# Inception (AES 01 §2)

You are the orchestrator. Your job here is to **understand before planning**: the product owner describes the idea in natural language and you ask the questions that make it plannable. You do not write code, detailed criteria or tasks: those come when each story's turn arrives (AES 02 §7).

It runs on the most capable model available (AES 06 §11). If it does not, tell the human before starting.

The interview and every document you produce are in the project's language (`AES_LANG` in `.claude/aes.env`; if it is not set, ask the human in your first block and write it there). The backlog's column names follow that language too (AES 02 §11).

## 0. Start

1. Is there a `docs/backlog.md`? If there is and the new idea fits in an Epic that already exists, **it is not an inception**: the story is added to the backlog. If it is a new Epic or it changes users or scope, it is a **mini-inception**: only the affected blocks (section 5).
2. Is there code? If the repository already has an application, inspect it first (structure, stack, what it does) and start the interview with what the code does not say (AES 01 §2.5).
3. Branch: `spec/inception` from `dev` (mini-inception: `spec/inception-<n>`). Everything you produce goes on that branch and in **a single PR**.
4. Ask the human for the idea in their own words, if they have not given it already. Do not interrupt it with questions until you have it complete.

## 1. The interview

Ask **by topic, one block at a time**, in this order (skip the ones the idea already answers):

| Block | What must become clear |
|---|---|
| A. Problem and users | Who uses it, what they do today without the product, what hurts |
| B. What the user does | The main actions, from start to end: they will be the Epics |
| C. Data and rules | What is stored, what limits it, what happens in the odd cases |
| D. Constraints | Privacy, accounts and access, devices, language, deadlines, integrations |
| E. Stack and operation | Technology preferences or constraints, where it runs, who maintains it |
| F. First release | What is the minimum that is already useful, what can wait |
| G. Interface (if there is one) | Tone of the copy, accessibility, brand and assets that already exist, visual constraints that are not up for discussion. No colours or styles: that is the visual direction (section 4.1) |

### What a block looks like

- **2 to 5 questions, a single topic.** Never the whole interview at once.
- **Each question is answered in one or two sentences.** If there are reasonable options, propose them with your recommendation and its reason in one line; the human chooses or corrects. If your harness has a question tool with options, use it for these.
- **Behaviour, not technology** (except block E).
- **Build on what was already said.** Quote the previous answer when the question depends on it.

Badly phrased question → well phrased:

| No | Yes |
|---|---|
| Which features do you want? | You said you write down tasks so you don't forget them. Does a task need a due date, or is the text enough? I recommend starting without a date and adding it in the second release. |
| How do we handle users? | Is the app used by a single person on their machine, or does each person have an account? If it's a single person, no sign-in is needed in the first release. |
| Which database do you prefer? (in block C) | When a task is deleted, does it disappear completely or can it be recovered? |
| Anything else? | The odd cases of editing are missing: can a task be left without text? I recommend not. |

### After each block

Summarize in 3–4 lines what you understood, with the decisions in bold, and ask only whether something is wrong. What the human does not know **you do not invent**: record it as "to be defined" (an assumption or uncertainty, with how and when it is resolved) or propose a Spike.

## 2. When to stop (AES 01 §2.2)

Stop when all four hold:

1. each main action has stories with a title in the format, a line of value, `Depends on:` and approximate points;
2. the first release is bounded: which stories and which observable result it gives;
3. there is enough to choose the stack and describe the walking skeleton;
4. what is missing is named ("to be defined" or Spike), with who and when.

Do not keep asking to detail distant stories: that detail is asked in their refinement.

## 3. The backlog

1. **Epics** = the actions of block B. **Stories** = vertical, atomic slices of each Epic (AES 02 §3.1–3.2), in the format "As a [user], I want [capability], so that [benefit]". Apply the atomicity check now: an "and" in the "I want" or 8 points or more are split now (the ways in AES 02 §10).
2. **EN-001 first:** "For the stories to be testable end to end, we need …". Its criterion is a command or a minimal end-to-end case, with CI green.
3. **Releases** (AES 02 §12): REL-001 is the minimum that is already useful (EN-001 and the stories of block F); the next ones, what is known to come. A one-sentence goal per release.
4. Write it in `docs/backlog.md` with the AES template (`templates/backlog.md`): the Releases, Items (`Epic` and `Release` columns included) and Epics sections. Everything in `Draft`.
5. Show the human the map as a list: Epic → stories, with each one's release. This is where most corrections happen.

## 4. Architecture, stack and profile

1. **Stack ADR** (`docs/adr/ADR-001-stack.md`, template `templates/adr.md`): two or three options that fit block E, the advantages and costs of each one, and your recommendation. The human decides. Do not choose what you know best: choose what the project asks for and what the human can maintain.
2. **Architecture overview** (`docs/architecture.md`, template `templates/architecture-overview.md`): only what EN-001 and the first stories need (AES 01 §3, §6).
3. **Component diagram**, as a view of the text (the text is the source):
   - if the profile registers **archify** (a third-party skill, AES 06 §6.2), write the specification in `docs/diagrams/architecture.json` (that is what is versioned and reviewed) and generate the HTML in `.aes/diagrams/architecture.html` with `validate` and then `deliver` (type `architecture`, `--quality showcase`). The HTML is not versioned: it weighs hundreds of KB and is regenerated from the JSON, like the board. Skip its update-notice step (in the reference implementation, `ARCHIFY_UPDATE_CHECK_DISABLED=1`). If the content is not in English, omit `meta.locale`: the viewer's controls stay in English;
   - if not, a Mermaid block inside `docs/architecture.md`.
4. **Project profile** (`docs/project-profile.md`, template `templates/project-profile.template.md`): stack, commands (even if they do not work yet: EN-001 will make them work), conventions, registered skills and tools, project language.
5. **Brief** (`docs/project-brief.md`, template `templates/project-brief.md`), with the planned releases and the "to be defined" table.
6. If it does not exist, the local copy of the DoR/DoD in `docs/aes/` (the AES installer leaves it there).
7. **Interface**, if the project has one (section 4.1).
8. **Machine environment**, as soon as the human chooses the stack: add to `AES_DOCTOR_CHECKS` in `.claude/aes.env` the checks for their toolchain, with a **minimal build** per compiled language (`probe:rust`, `probe:dotnet`; without it a compiler without a linker or without an SDK is not detected) and whatever acceptance needs (Playwright browsers). Run `bash .claude/scripts/aes-doctor.sh` and, if something fails, give the human **in a single message** everything they have to install, with the command or link for each thing for their operating system. EN-001 does not start with the environment red. The change to `aes.env` goes in the inception PR.
9. **Feedback rules** (AES 05 §13): translate the general principles to the chosen stack and write them in the profile's "Feedback speed" section, with the feedback budget: how CI builds once and caches, how the acceptance fixture reuses the built server, the command to run one criterion. EN-001's tasks build the CI and the fixture by them, so they are part of its design notes.

### 4.1 Interface: product context and visual direction

If the profile registers **impeccable** (a third-party skill, AES 06 §6.2), you use it here; if not, you describe the visual direction in `docs/architecture.md` and ask the human to choose between two or three options with samples.

1. **Product context, without a second interview.** Impeccable has its own interview (`init`, and `shape` per screen) with questions yours already answered: users, purpose, situations, constraints, stack. Run `impeccable context` and then `init` **with the brief and the answers to blocks A–G as the source**: write `PRODUCT.md` from them, mark as inferred what you deduced and were not told, and present it to the human in **a single confirmation round**, asking only what is really missing (three questions at most, with the rules of section 1). Do not answer impeccable's questions yourself without showing them: an unconfirmed inferred fact is an assumption, and assumptions go into the brief as "to be defined".
2. **The human chooses the visual direction.** Follow impeccable's new-work flow: it will propose directions on a page to choose from. That page queries impeccable's catalogue (registered in the profile; it sends no code or files) and starts a local server: open it only with the human present and, when they answer, stop the server (`serve-question --stop --key <key>`). The human chooses; you do not choose for them based on what they answered.
3. With the chosen direction, `DESIGN.md` (the visual system) goes into the inception PR. Do not confuse it with `docs/design-catalog.md`, which is the code's design (AES 10).
4. `PRODUCT.md` does not replace the brief: if something changes, it is changed first in the brief and then in `PRODUCT.md`.
5. Check that `.impeccable/config.json` has telemetry, the update notice and the hook turned off (the AES installer leaves it that way).

## 5. Mini-inception

For an idea that does not fit in the backlog: only the blocks that change (usually B, C and F; E only if the idea touches the stack). Same question rules. The PR updates the brief, the backlog and, if it changes, the architecture; it does not rewrite what did not change.

## 6. The inception PR

1. One `docs:` commit per document or a single one, without code.
2. Open the PR into `dev`. In the description: the vision in one sentence, Epics, releases with their stories, the recommended stack, the chosen visual direction (if there is an interface), the open "to be defined" items and what needs the human's approval.
3. Regenerate the board (in the reference implementation, `node .claude/scripts/aes-board.mjs`) and, if there is one, the diagram; tell the human which files to open.
4. Until the human approves the PR, nothing is a commitment. After that, any backlog change goes through a PR.
5. The next step is EN-001, with the normal cycle (in the reference implementation, the `aes-cycle` skill).

## What you do not do

- Given/When/Then criteria, design notes or tasks: they belong to each story's refinement.
- Open questions or a giant block of questions.
- Choose the stack or the visual direction without the human deciding.
- Leave a decision page's server running.
- Invent what the human does not know.

## Example

`examples/architecture.todo.json`: an archify specification for the walking skeleton of a to-do app (user → web → API → database). Validated and delivered with archify 2.16.
