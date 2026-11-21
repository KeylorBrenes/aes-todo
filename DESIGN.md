---
name: aes-todo
status: direction
source-world: digital-design-canon-warm-consumer-app-surface
chosen-by: product owner, inception decision round (2026-11-21), seed:d4550ae3e2c8d0d4
---

# Design

> **Status: direction, before the build.** Chosen by the product owner during the inception. The colors and sizes below are the starting contract; the first UI build (EN-001 and the REL-001 stories) resolves them, and `impeccable document` (documenter) refreshes this file from the shipped interface. Changing the visual direction is the owner's decision.
> Reference composition: `.impeccable/mocks/decision/challenger-warm-app.html` (local, not versioned). Craft bar: https://impeccable.style/worlds/cards/digital-design-canon-warm-consumer-app-surface-hero.webp

## World
A warm consumer app: soft-cornered white cards on a warm tinted ground, generous touch targets, plain-language labels, and **one saturated action color that appears only where something can be done**. The task in progress is the loudest element on screen.

## Color
Strategy: Restrained ground plus one action color; label colors live only inside label pills.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ground` | `#F6F1EB` | `#1E1B18` | Page background |
| `--surface` | `#FFFFFF` | `#2A2622` | Cards, bottom bar, inputs |
| `--surface-sunk` | `#F1EAE1` | `#35302B` | Neutral pills, pressed states |
| `--ink` | `#2D2A26` | `#F3EDE6` | Main text; ground of the "En curso" card in light mode |
| `--ink-muted` | `#6E665C` | `#B3A99D` | Meta lines (dates, durations at rest) |
| `--line` | `#CFC6BA` | `#4A433C` | Circle control border, dividers |
| `--action` | `#D63D1A` | `#FF7A59` | Primary buttons, active tab, FAB, focus ring |
| `--on-action` | `#FFFFFF` | `#1E1B18` | Text on the action color |
| `--danger` | `#B42318` | `#F97066` | Delete permanently (trash only) |

- Contrast: `--ink-muted` on `--ground` ≥ 4.5:1; `--on-action` on `--action` ≥ 4.5:1 in both modes. Every new pair is checked against WCAG 2.2 AA.
- Label palette (the owner picks one per label): tomato `#E4572E`, amber `#E8A33D`, olive `#7C9A3A`, teal `#2A9D8F`, blue `#3B6FD8`, violet `#8E5CD9`, pink `#D9548F`, slate `#64748B`. In a pill the color is a dot plus a 12% tint background; the label name is always shown in `--ink`.
- Dark mode is required: follows `prefers-color-scheme` and can be overridden manually (US-022).

## Typography
- Face: **Nunito** (rounded humanist sans), fallback `system-ui, sans-serif`. Weights 400, 600, 800.
- Every time value (counters, durations, dates) uses `font-variant-numeric: tabular-nums`.
- Scale: 13 (meta) · 16 (body, task titles 600) · 20 (card headings) · 32 (screen title 800) · 40 (running counter 800).

## Space, shape and elevation
- Base unit 4 px: 4, 8, 12, 16, 20, 24, 32, 48.
- Radii: cards 20 px, "En curso" card 24 px, inputs 14 px, buttons and pills fully rounded (999 px).
- Elevation: cards flat on the ground; the bottom bar alone has a soft shadow (`0 8px 24px` of ink at 12%).
- Touch targets ≥ 44 px; the circle control is 28 px visible inside a 44 px hit area.

## Layout
- One centered column, max 640 px, side margins of 16 px on the phone.
- Floating bottom bar, reachable by thumb: Pendientes · Proyectos · **+** (new task, action color) · Etiquetas · Papelera. Same on desktop; a side navigation is decided when REL-002 adds more screens.
- Minimum width 360 px.

## Components
- **Task card:** circle control (start/complete), title (600), meta line (created date, or "Duró 22 min 14 s" once complete), label pills on the right. Completed: title struck through in `--ink-muted`.
- **"En curso" card (signature):** inverse (ink ground, light text) with the task name, a live HH:MM:SS counter and a "Completar" pill in the action color. Always at the top of the list while a task is running.
- **Subtasks (REL-002):** nested inside the parent card, with an "N de M subtareas" progress line.
- **Pills:** neutral (`--surface-sunk`) or label (tinted, with a dot).
- **Empty states:** neutral impersonal copy ("No hay tareas pendientes.").
- **Destructive actions:** delete sends to the trash with a short undo; only the trash shows "Eliminar definitivamente" in `--danger`, with a confirmation.

## Motion
Soft spring on press (scale 0.98), no bounce on entry; the counter ticks without layout shift; completing a task settles the running card into the card's meta line. `prefers-reduced-motion` removes the springs and transitions.

## Copy
Spanish, neutral and impersonal ("No hay tareas pendientes", "Agregar tarea"), never "tú" or "usted". Always from i18n catalogs (English in REL-003).
