#!/usr/bin/env node
// AES — Backlog views (standard/02 §11).
//
// The backlog lives in a file (docs/backlog.md) and is the single source of truth. This script
// generates views in one direction only:
//   - a self-contained HTML board (no service at all), in .aes/board.html by default, from
//     the aes-board.html template: a "Next" sign (what to work on and the phrase for the orchestrator),
//     the stabilization gate, every card with its dependency status, a detail view with the
//     path of requirements, releases, metrics (docs/harness-findings.md and .aes/costs.csv) and a guide;
//   - JSON (--json), so that an adapter can publish it to GitHub Projects, Trello, GitLab…
//
// Usage: node .claude/scripts/aes-board.mjs [docs/backlog.md] [--json] [--out <file>]
//        node .claude/scripts/aes-board.mjs --install-hook   regenerates the board by itself after each pull
//        node .claude/scripts/aes-board.mjs --check-hook     is it installed? (exits with 1 if not)
//
// The hook (git post-merge and post-rewrite, local: not versioned) only acts in the main
// checkout, never in the roles' worktrees, and does nothing if node or the backlog is missing.
//
// The backlog table is recognized by its headers (in any order), in English or Spanish: ID, Type,
// Title, Depends on, Points, Priority, Severity, Status and, optionally, Epic and Release (02 §12). Only ID,
// Title and Status are essential. The board filters by release and shows each one's progress.
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// --- Git hook: the board up to date without anyone asking ----------------------------------------
// The mark installed before 2.0.0 is still recognized, so an existing hook is not added twice.
const HOOK_MARK = '# aes-board: regenerates .aes/board.html';
const HOOK_MARKS = [HOOK_MARK, '# aes-board: regenera .aes/board.html'];
const HOOK = `#!/bin/sh
${HOOK_MARK} after updating the main checkout (AES 02 §11).
[ "$(git rev-parse --git-dir)" = "$(git rev-parse --git-common-dir)" ] || exit 0
[ -f docs/backlog.md ] && [ -f .claude/scripts/aes-board.mjs ] || exit 0
command -v node >/dev/null 2>&1 || exit 0
node .claude/scripts/aes-board.mjs >/dev/null 2>&1 || true
exit 0
`;
if (process.argv.includes('--install-hook') || process.argv.includes('--check-hook')) {
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
  const hooksDir = resolve(git('rev-parse', '--git-path', 'hooks'));
  let missing = 0;
  for (const name of ['post-merge', 'post-rewrite']) {
    const f = join(hooksDir, name);
    const cur = existsSync(f) ? readFileSync(f, 'utf8') : '';
    if (HOOK_MARKS.some((m) => cur.includes(m))) continue;
    if (process.argv.includes('--check-hook')) { missing++; continue; }
    if (cur && !cur.startsWith('#!/bin/sh') && !cur.startsWith('#!/usr/bin/env')) { console.error(`aes-board: ${f} exists and is not a shell script: leaving it alone.`); missing++; continue; }
    // If there is already a hook of one's own, it is appended without removing anything.
    const body = cur ? `${cur.replace(/\n?exit 0\s*$/, '')}\n${HOOK.split('\n').slice(1).join('\n')}` : HOOK;
    mkdirSync(hooksDir, { recursive: true }); writeFileSync(f, body); try { chmodSync(f, 0o755); } catch {}
    console.log(`aes-board: hook ${name} installed.`);
  }
  process.exit(missing ? 1 : 0);
}

const args = process.argv.slice(2);
const json = args.includes('--json');
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;
const src = args.find((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1)) ?? 'docs/backlog.md';
const root = dirname(dirname(resolve(src)));   // docs/backlog.md → project root
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

// --- Markdown tables -------------------------------------------------------------------------------
const norm = (h) => h.trim().replace(/[`*]/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const cellsOf = (line) => line.split('|').slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, '').replace(/`([^`]*)`/g, '$1'));
/** Every table in a markdown file, with the section (## …) it is in. */
function tables(md) {
  const lines = md.split(/\r?\n/); const found = []; let section = '';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,6}\s/.test(l)) { section = l.replace(/^#+\s*/, '').trim(); continue; }
    if (!l.trim().startsWith('|') || !/^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) continue;
    const head = cellsOf(l).map(norm); const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith('|'); j++) rows.push(cellsOf(lines[j]));
    found.push({ section, head, rows }); i = j - 1;
  }
  return found;
}
const col = (t, ...names) => t.head.findIndex((h) => names.includes(h));
const blank = (v) => (v === '—' || v === '-' || v === undefined ? '' : v);

// --- Backlog --------------------------------------------------------------------------------------
const md = read(src);
if (md === null) { console.error(`aes-board: no existe ${src}.`); process.exit(2); }
const all = tables(md);
const itemsTable = all.find((t) => col(t, 'id') >= 0 && col(t, 'titulo', 'title') >= 0 && col(t, 'estado', 'status', 'state') >= 0);
if (!itemsTable) throw new Error(`No table with the columns ID, Title and Status was found in ${src} (AES 02 §11).`);
const C = {
  id: col(itemsTable, 'id'), tipo: col(itemsTable, 'tipo', 'type'), epic: col(itemsTable, 'epic', 'epica'),
  titulo: col(itemsTable, 'titulo', 'title'), requiere: col(itemsTable, 'requiere', 'requires', 'depends on'),
  puntos: col(itemsTable, 'puntos', 'points', 'pts'), prioridad: col(itemsTable, 'prioridad', 'priority'),
  release: col(itemsTable, 'release'), severidad: col(itemsTable, 'severidad', 'severity'), estado: col(itemsTable, 'estado', 'status', 'state'),
};
const items = itemsTable.rows.map((r, order) => {
  const g = (k) => (C[k] >= 0 ? blank((r[C[k]] ?? '').trim()) : '');
  return {
    id: g('id'), tipo: g('tipo'), titulo: g('titulo'), puntos: g('puntos'), prioridad: g('prioridad'),
    severidad: g('severidad'), estado: g('estado') || 'Draft', epic: g('epic'), release: g('release'),
    requiere: g('requiere').split(/[,\s]+/).filter(Boolean), order,
  };
}).filter((i) => i.id);

const relTable = all.find((t) => ['releases', 'versiones'].includes(norm(t.section)) && col(t, 'release') >= 0);
const releases = relTable ? relTable.rows.map((r) => ({
  id: blank(r[col(relTable, 'release')] ?? ''), objetivo: blank(r[col(relTable, 'objetivo (lo que el usuario ya puede hacer)', 'objetivo', 'goal (what the user can already do)', 'goal', 'objective')] ?? r[1] ?? ''),
  estado: blank(r[col(relTable, 'estado', 'status', 'state')] ?? ''),
})).filter((r) => r.id) : [];
for (const id of new Set(items.map((i) => i.release).filter(Boolean))) if (!releases.some((r) => r.id === id)) releases.push({ id, objetivo: '', estado: '' });
releases.sort((a, b) => a.id.localeCompare(b.id, 'es', { numeric: true }));

const epicTable = all.find((t) => norm(t.section) === 'epics' && col(t, 'epic', 'epica') >= 0);
const epics = epicTable ? epicTable.rows.map((r) => ({ id: blank(r[col(epicTable, 'epic', 'epica')] ?? ''), que: blank(r[1] ?? '') })).filter((e) => e.id) : [];

// Notes: "- US-001: …" under "## Notes" (or "## Notas").
const notes = {};
const notesBlock = md.split(/^##\s+(?:Notas|Notes)\s*$/m)[1]?.split(/^##\s/m)[0] ?? '';
for (const m of notesBlock.matchAll(/^\s*[-*]\s+([A-Z]{2,4}-\d+):\s*(.+)$/gm)) (notes[m[1]] ??= []).push(m[2].trim());

const visionM = md.match(/\*\*(?:Visi[oó]n|Vision):\*\*\s*(.+)/);
const titleM = md.match(/^#\s+(.+)$/m);

// --- Metrics, costs, gate -------------------------------------------------------------------------
const metrics = {};
const hf = read(join(root, 'docs/harness-findings.md'));
if (hf) {
  const t = tables(hf).find((x) => col(x, 'elemento', 'item') >= 0 && col(x, 'ciclos fail', 'fail cycles') >= 0);
  if (t) for (const r of t.rows) {
    const id = blank(r[col(t, 'elemento', 'item')] ?? ''); if (!id) continue;
    const g = (...n) => blank(r[col(t, ...n)] ?? '');
    metrics[id] = { inicio: g('inicio', 'start'), fin: g('fin', 'end'), fails: g('ciclos fail', 'fail cycles'), costo: g('costo', 'cost'), api: g('tiempo de api', 'api time'), total: g('tiempo total', 'total time'), modelos: g('modelo real por rol', 'actual model per role') };
  }
}
const runs = {};
const csv = read(join(root, '.aes/costs.csv'));
if (csv) {
  const [h, ...rows] = csv.trim().split(/\r?\n/); const H = h.split(',');
  const k = (n) => H.indexOf(n);
  for (const line of rows) {
    const c = line.split(','); const id = c[k('elemento')]; if (!id) continue;
    const r = (runs[id] ??= { runs: 0, tokens: 0, usd: 0, roles: {}, modelos: new Set(), fallos: 0 });
    const tok = ['entrada', 'salida', 'razonamiento', 'cache'].reduce((n, x) => n + (Number(c[k(x)]) || 0), 0);
    r.runs++; r.tokens += tok; r.usd += Number(c[k('usd_estimado')]) || 0;
    r.roles[c[k('rol')]] = (r.roles[c[k('rol')]] ?? 0) + (Number(c[k('usd_estimado')]) || 0);
    r.modelos.add(c[k('modelo')]); if (c[k('estado')] && c[k('estado')] !== 'ok') r.fallos++;
  }
  for (const r of Object.values(runs)) r.modelos = [...r.modelos];
}
const env = read(join(root, '.claude/aes.env')) ?? '';
const minorLimit = Number(env.match(/^AES_MINOR_LIMIT="?(\d+)/m)?.[1] ?? 5);
const exists = (p) => existsSync(join(root, p));

// --- Derived --------------------------------------------------------------------------------------
const DONE = new Set(['accepted', 'released']);
const CLOSED = new Set(['accepted', 'released', 'rejected']);
const OFF = new Set(['deferred', 'rejected']);
const ACTIVE = new Set(['in progress', 'in review', 'ready for acceptance', 'blocked']);
const byId = new Map(items.map((it) => [it.id, it]));
const lc = (s) => s.toLowerCase();
for (const it of items) {
  it.prefijo = it.id.split('-')[0];
  it.hecho = DONE.has(lc(it.estado));
  it.pendientes = it.requiere.filter((r) => !DONE.has(lc(byId.get(r)?.estado ?? '')));
  it.bloquea = items.filter((o) => o.requiere.includes(it.id)).map((o) => o.id);
  it.notas = notes[it.id] ?? [];
  it.spec = exists(`specs/${it.id}/${it.id}.md`) ? `specs/${it.id}/${it.id}.md` : '';
  it.retro = exists(`docs/retrospectives/${it.id}.md`) ? `docs/retrospectives/${it.id}.md` : '';
  it.metricas = metrics[it.id] ?? null;
  it.corridas = runs[it.id] ?? null;
}
const defects = items.filter((i) => i.severidad && !CLOSED.has(lc(i.estado)));
const sevKey = (s) => lc(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const gate = {
  criticas: defects.filter((d) => ['critica', 'critical'].includes(sevKey(d.severidad))).map((d) => d.id),
  graves: defects.filter((d) => ['alta', 'media', 'high', 'medium'].includes(sevKey(d.severidad))).map((d) => d.id),
  menores: defects.filter((d) => ['menor', 'minor', 'baja', 'low'].includes(sevKey(d.severidad))).map((d) => d.id),
  limite: minorLimit,
};
gate.abierta = gate.criticas.length + gate.graves.length === 0 && gate.menores.length <= minorLimit;
const EXEMPT = new Set(['BUG', 'ST', 'CH', 'SP']);
for (const it of items) {
  it.lista = !it.hecho && !OFF.has(lc(it.estado)) && it.pendientes.length === 0;
  it.frenadaPorCompuerta = it.lista && !gate.abierta && !EXEMPT.has(it.prefijo) && lc(it.estado) === 'draft';
}
// Next: what is already in progress; if the gate is closed, its defects; if not, what is ready by
// priority, release and backlog order.
const prio = (p) => { const m = /P(\d)/i.exec(p); return m ? Number(m[1]) : 9; };
const relRank = (r) => { const i = releases.findIndex((x) => x.id === r); return i < 0 ? 99 : i; };
const rank = (a, b) => prio(a.prioridad) - prio(b.prioridad) || relRank(a.release) - relRank(b.release) || a.order - b.order;
const enCurso = items.filter((i) => ACTIVE.has(lc(i.estado))).sort(rank);
const listas = items.filter((i) => i.lista && !ACTIVE.has(lc(i.estado)) && !i.frenadaPorCompuerta).sort(rank);
// Project language (AES_LANG in .claude/aes.env): that of the interface and of the phrases.
// Without AES_LANG (projects older than 2.0.0), it is deduced from the backlog's columns.
const lang = (env.match(/^AES_LANG="?(es|en)/m)?.[1]) ?? (itemsTable.head.includes('titulo') ? 'es' : 'en');
const M = {
  en: {
    critical: 'A Critical defect is open: only its fix is worked on.',
    active: (st) => `Already ${st === 'In Review' ? 'in review' : 'in progress'}: finish it before starting another (one item per session).`,
    closed: 'The stabilization gate is closed: no new story becomes Ready until defects are fixed.',
    ready: (it) => [it.requiere.length ? `Its prerequisites (${it.requiere.join(', ')}) are accepted.` : 'It depends on nothing.',
      [it.prioridad && `Priority ${it.prioridad}`, it.release && `in ${it.release}`].filter(Boolean).join(', ')].filter(Boolean).join(' ') + '.',
    batch: (ids) => `Run a stabilization batch with ${ids}`, cont: (id) => `Continue ${id} with aes-cycle`,
    by: { BUG: (id) => `Fix ${id} with aes-cycle`, SP: (id) => `Investigate ${id} with aes-cycle`, ST: (id) => `Run batch ${id} with aes-cycle`, CH: (id) => `Do chore ${id} with aes-cycle` },
    adv: (id) => `Advance ${id} with aes-cycle`,
  },
  es: {
    critical: 'Hay un defecto Crítico abierto: solo se trabaja en su corrección.',
    active: (st) => `Ya está ${st === 'In Review' ? 'en revisión' : 'en curso'}: termínalo antes de empezar otro (un elemento por sesión).`,
    closed: 'La compuerta de estabilización está cerrada: ninguna historia nueva pasa a Ready hasta corregir defectos.',
    ready: (it) => [it.requiere.length ? `Sus requisitos (${it.requiere.join(', ')}) ya están aceptados.` : 'No depende de nada.',
      [it.prioridad && `Prioridad ${it.prioridad}`, it.release && `del ${it.release}`].filter(Boolean).join(', ')].filter(Boolean).join(' ') + '.',
    batch: (ids) => `Hagamos un lote de estabilización con ${ids}`, cont: (id) => `Continuemos ${id} con aes-cycle`,
    by: { BUG: (id) => `Corrijamos ${id} con aes-cycle`, SP: (id) => `Investiguemos ${id} con aes-cycle`, ST: (id) => `Hagamos el lote ${id} con aes-cycle`, CH: (id) => `Hagamos el chore ${id} con aes-cycle` },
    adv: (id) => `Avancemos ${id} con aes-cycle`,
  },
}[lang];
let siguiente = null; let motivo = '';
if (gate.criticas.length) { siguiente = byId.get(gate.criticas[0]); motivo = M.critical; }
else if (enCurso.length) { siguiente = enCurso[0]; motivo = M.active(siguiente.estado); }
else if (!gate.abierta) {
  siguiente = listas.find((i) => i.prefijo === 'ST') ?? listas.find((i) => i.severidad) ?? null;
  motivo = M.closed;
} else if (listas.length) { siguiente = listas[0]; motivo = M.ready(siguiente); }
const phrase = (it) => {
  if (!it) return '';
  if (gate.menores.length + gate.graves.length && it.severidad && !gate.abierta) return M.batch([...gate.criticas, ...gate.graves, ...gate.menores].join(', '));
  if (ACTIVE.has(lc(it.estado))) return M.cont(it.id);
  return (M.by[it.prefijo] ?? M.adv)(it.id);
};
for (const it of items) it.frase = phrase(it);
const alternativas = listas.filter((i) => i !== siguiente).slice(0, 4).map((i) => i.id);

if (json) {
  const text = JSON.stringify({ source: src, generatedAt: new Date().toISOString(), gate, siguiente: siguiente?.id ?? null, releases, epics, items }, null, 2);
  if (out) { mkdirSync(dirname(resolve(out)), { recursive: true }); writeFileSync(out, text); console.log(out); }
  else console.log(text);
  process.exit(0);
}

// --- HTML -----------------------------------------------------------------------------------------
const project = (titleM?.[1] ?? '').replace(/^Backlog\s*[—-]\s*/i, '').replace(/\s*\((?:nombre provisional|working title)\)\s*$/i, '').replace(/\s*\(.*\)$/, '').trim() || 'Backlog';
const target = out ?? '.aes/board.html';
const data = {
  lang, base: relative(dirname(resolve(target)), root).replace(/\\/g, '/') || '.', project, vision: visionM?.[1]?.trim() ?? '', generado: new Date().toISOString(), fuente: src,
  gate, siguiente: siguiente?.id ?? null, motivo, frase: siguiente ? siguiente.frase : '', alternativas,
  releases, epics, items, totales: { runsUsd: Object.values(runs).reduce((n, r) => n + r.usd, 0) },
};
const html = readFileSync(new URL('./aes-board.html', import.meta.url), 'utf8')
  .replace('/*__AES_DATA__*/null', () => JSON.stringify(data).replace(/</g, '\\u003c'))
  .replace('<title>Backlog</title>', () => `<title>Backlog · ${project.replace(/[<&]/g, '')}</title>`);
mkdirSync(dirname(resolve(target)), { recursive: true });
writeFileSync(target, html);
console.log(`${lang === 'es' ? 'Tablero' : 'Board'}: ${target} (${pathToFileURL(resolve(target)).href})`);
