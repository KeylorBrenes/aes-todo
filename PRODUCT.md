# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Rust (Axum + SQLx) with SQLite on the server; React + TypeScript + Vite on the web. Single binary serves the compiled web. Decided by the product owner in `docs/adr/ADR-001-stack.md`.

## Users
One person: the product owner, who is also the only account holder. Today they keep tasks on paper or loose notes and lose them. Uses the app in the browser on a desktop computer and on a phone.

## Product Purpose
A personal to-do list that never loses data: tasks live on the server behind a password, so they survive closing or clearing the browser or switching browsers or devices. Tasks can be grouped into projects (a parent task with subtasks, two levels), tagged with colored labels, and timed: an explicit "Start" and "Complete" record how long a task really took, shown in days, hours, minutes and seconds. Success: paper is no longer needed and nothing written down is ever lost.

## Positioning
A to-do list that measures how long each task actually took, from start to completion, rather than only tracking whether it is done, and that treats data safety (server storage, trash instead of hard delete, daily backup) as the first feature.

## Operating Context
Quick capture and status changes during the day, often from the phone; planning and reviewing projects and durations from the desktop. Single user, no collaboration.

## Capabilities and Constraints
- Single account with username and password (Argon2id); session persists per browser until signed out.
- Tasks: create, view (with creation date), edit text, delete to a trash (restore or delete permanently).
- Time: created, started and completed timestamps; duration = completed − started, no pause; a completed task can be reopened, keeping its start.
- Projects: two levels only. A parent with subtasks completes automatically when all its subtasks are complete and reverts to pending if one is added or reopened; a parent without subtasks is completed manually. Deleting a parent takes its subtasks with it, after a warning stating how many.
- Labels: user-created, each with a color from a palette; a task can have several.
- Languages: Spanish first; English in a later release. All UI strings are translatable from the start.
- Dark mode is required, alongside light mode.
- Releases: REL-001 core (login, tasks, start/complete with duration, local); REL-002 projects, labels, trash, reopen; REL-003 dark mode, English, daily backup, internet deployment.
- Undecided: product name and logo; password recovery; where the app is hosted; filtering by label.

## Brand Commitments
- No name or logo yet; "aes-todo" is a provisional working name.
- Voice: neutral and impersonal in Spanish ("No hay tareas pendientes."), not "tú" nor "usted".
- The owner asked for a clean, pretty UI with several colors.

## Evidence on Hand
None. No real content, screenshots, testimonials or assets exist; future work must not fabricate them.

## Product Principles
1. Nothing is lost: every destructive action is reversible or explicitly confirmed.
2. Time is a first-class fact: start, completion and duration are always visible where they matter.
3. Calm over clutter: a personal tool that stays clean as the list grows.
4. Same experience on phone and desktop.

## Accessibility & Inclusion
WCAG 2.2 AA: sufficient contrast in light and dark modes, full keyboard use, screen reader support. Colored labels must never rely on color alone (the name is always shown).
