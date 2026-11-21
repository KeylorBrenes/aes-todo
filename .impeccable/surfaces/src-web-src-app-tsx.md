---
version: 1
slug: "src-web-src-app-tsx"
primary_target: "src/web/src/App.tsx"
related_targets: []
---

## Scope
Main task list screen (home after sign-in) of aes-todo. Mode: Operate. Built code-led in EN-001 and the REL-001 stories.

## Audience and task
The single owner. Quick capture and start/complete from the phone during the day; planning projects and reviewing durations on desktop. Data must feel safe: nothing disappears without a way back.

## Direction contract
THESIS: A calm, thumb-first task column where the one task in progress is always the loudest thing on screen, with its clock running. It refuses the category default of a grey sidebar plus checkbox list where time is invisible.
OWN-WORLD: Warm tinted ground (#F6F1EB), white soft cards (radius 20), dark ink (#2D2A26), a single action color (#D63D1A light / #FF7A59 dark) used only on things you can press. Label colors live only in pills. Rounded humanist sans (Nunito), tabular figures for every time value.
STORY: The owner sees what is pending and what is running, starts or completes a task in one tap, and reads how long each task took; deleted tasks go to a trash, never vanish.
FIRST VIEWPORT: Single centered column (max 640 px). Title "Pendientes" with date and count; below it the dark inverse "En curso" card with task name, live counter HH:MM:SS and a "Completar" action; then task cards (circle control, title, meta line with creation date or duration, label pills). Floating bottom bar: Pendientes, Proyectos, + (new task, action color), Etiquetas, Papelera.
FORM: challenger digital-design-canon-warm-consumer-app-surface, chosen by the owner over the assigned direction; seed:d4550ae3e2c8d0d4
SIGNATURE: the inverse "En curso" card with the running clock; on complete it settles into the card's meta line as "Duró 22 min 14 s".
MOTION: soft spring on press, no bounce on entry; counter ticks without layout shift (tabular nums); prefers-reduced-motion removes springs.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints
WCAG 2.2 AA in light and dark; dark mode required; labels never color-only (name always shown); Spanish neutral impersonal copy from i18n catalogs; 360 px minimum width.

## Open
Product name and logo; desktop navigation beyond the floating bar (decide when REL-002 adds projects and labels screens).
