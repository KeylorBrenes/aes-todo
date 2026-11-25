#!/usr/bin/env node
// AES 1.6.0 — Vistas del backlog (standard/02 §11).
//
// El backlog vive en un archivo (docs/backlog.md) y es la única fuente de verdad. Este script
// genera vistas en una sola dirección:
//   - un tablero HTML autocontenido (sin ningún servicio), por defecto en .aes/board.html, a partir de
//     la plantilla aes-board.html: letrero «Siguiente» (qué trabajar y la frase para el orquestador),
//     compuerta de estabilización, todas las tarjetas con su estado de dependencias, detalle con la
//     ruta de requisitos, releases, métricas (docs/harness-findings.md y .aes/costs.csv) y una guía;
//   - JSON (--json), para que un adaptador lo publique en GitHub Projects, Trello, GitLab…
//
// Uso: node .claude/scripts/aes-board.mjs [docs/backlog.md] [--json] [--out <archivo>]
//      node .claude/scripts/aes-board.mjs --install-hook   regenera el tablero solo tras cada pull
//      node .claude/scripts/aes-board.mjs --check-hook     ¿está instalado? (sale con 1 si no)
//
// El hook (post-merge y post-rewrite de git, locales: no se versionan) solo actúa en el checkout
// principal, nunca en los worktrees de los roles, y no hace nada si falta node o el backlog.
//
// La tabla del backlog se reconoce por sus encabezados (en cualquier orden): ID, Tipo, Título,
// Requiere, Puntos, Prioridad, Severidad, Estado y, opcionales, Epic y Release (02 §12). Solo ID,
// Título y Estado son imprescindibles. El tablero filtra por release y muestra el avance de cada uno.
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// --- Hook de git: tablero al día sin que nadie lo pida ------------------------------------------
const HOOK_MARK = '# aes-board: regenera .aes/board.html';
const HOOK = `#!/bin/sh
${HOOK_MARK} tras actualizar el checkout principal (AES 02 §11).
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
    if (cur.includes(HOOK_MARK)) continue;
    if (process.argv.includes('--check-hook')) { missing++; continue; }
    if (cur && !cur.startsWith('#!/bin/sh') && !cur.startsWith('#!/usr/bin/env')) { console.error(`aes-board: ${f} existe y no es un script de shell: no lo toco.`); missing++; continue; }
    // Si ya hay un hook propio, se añade al final sin quitarle nada.
    const body = cur ? `${cur.replace(/\n?exit 0\s*$/, '')}\n${HOOK.split('\n').slice(1).join('\n')}` : HOOK;
    mkdirSync(hooksDir, { recursive: true }); writeFileSync(f, body); try { chmodSync(f, 0o755); } catch {}
    console.log(`aes-board: hook ${name} instalado.`);
  }
  process.exit(missing ? 1 : 0);
}

const args = process.argv.slice(2);
const json = args.includes('--json');
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;
const src = args.find((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1)) ?? 'docs/backlog.md';
const root = dirname(dirname(resolve(src)));   // docs/backlog.md → raíz del proyecto
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

// --- Tablas markdown ------------------------------------------------------------------------------
const norm = (h) => h.trim().replace(/[`*]/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const cellsOf = (line) => line.split('|').slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, '').replace(/`([^`]*)`/g, '$1'));
/** Todas las tablas de un markdown, con la sección (## …) en la que están. */
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
const itemsTable = all.find((t) => col(t, 'id') >= 0 && col(t, 'titulo', 'title') >= 0 && col(t, 'estado', 'status') >= 0);
if (!itemsTable) throw new Error(`No se encontró en ${src} una tabla con las columnas ID, Título y Estado (AES 02 §11).`);
const C = {
  id: col(itemsTable, 'id'), tipo: col(itemsTable, 'tipo', 'type'), epic: col(itemsTable, 'epic', 'epica'),
  titulo: col(itemsTable, 'titulo', 'title'), requiere: col(itemsTable, 'requiere', 'requires'),
  puntos: col(itemsTable, 'puntos', 'points', 'pts'), prioridad: col(itemsTable, 'prioridad', 'priority'),
  release: col(itemsTable, 'release'), severidad: col(itemsTable, 'severidad', 'severity'), estado: col(itemsTable, 'estado', 'status'),
};
const items = itemsTable.rows.map((r, order) => {
  const g = (k) => (C[k] >= 0 ? blank((r[C[k]] ?? '').trim()) : '');
  return {
    id: g('id'), tipo: g('tipo'), titulo: g('titulo'), puntos: g('puntos'), prioridad: g('prioridad'),
    severidad: g('severidad'), estado: g('estado') || 'Draft', epic: g('epic'), release: g('release'),
    requiere: g('requiere').split(/[,\s]+/).filter(Boolean), order,
  };
}).filter((i) => i.id);

const relTable = all.find((t) => norm(t.section) === 'releases' && col(t, 'release') >= 0);
const releases = relTable ? relTable.rows.map((r) => ({
  id: blank(r[col(relTable, 'release')] ?? ''), objetivo: blank(r[col(relTable, 'objetivo (lo que el usuario ya puede hacer)', 'objetivo')] ?? r[1] ?? ''),
  estado: blank(r[col(relTable, 'estado', 'status')] ?? ''),
})).filter((r) => r.id) : [];
for (const id of new Set(items.map((i) => i.release).filter(Boolean))) if (!releases.some((r) => r.id === id)) releases.push({ id, objetivo: '', estado: '' });
releases.sort((a, b) => a.id.localeCompare(b.id, 'es', { numeric: true }));

const epicTable = all.find((t) => norm(t.section) === 'epics' && col(t, 'epic', 'epica') >= 0);
const epics = epicTable ? epicTable.rows.map((r) => ({ id: blank(r[col(epicTable, 'epic', 'epica')] ?? ''), que: blank(r[1] ?? '') })).filter((e) => e.id) : [];

// Notas: «- US-001: …» bajo «## Notas».
const notes = {};
const notesBlock = md.split(/^##\s+Notas\s*$/m)[1]?.split(/^##\s/m)[0] ?? '';
for (const m of notesBlock.matchAll(/^\s*[-*]\s+([A-Z]{2,4}-\d+):\s*(.+)$/gm)) (notes[m[1]] ??= []).push(m[2].trim());

const visionM = md.match(/\*\*Visi[oó]n:\*\*\s*(.+)/);
const titleM = md.match(/^#\s+(.+)$/m);

// --- Métricas, costos, compuerta ------------------------------------------------------------------
const metrics = {};
const hf = read(join(root, 'docs/harness-findings.md'));
if (hf) {
  const t = tables(hf).find((x) => col(x, 'elemento') >= 0 && col(x, 'ciclos fail') >= 0);
  if (t) for (const r of t.rows) {
    const id = blank(r[col(t, 'elemento')] ?? ''); if (!id) continue;
    const g = (...n) => blank(r[col(t, ...n)] ?? '');
    metrics[id] = { inicio: g('inicio'), fin: g('fin'), fails: g('ciclos fail'), costo: g('costo'), api: g('tiempo de api'), total: g('tiempo total'), modelos: g('modelo real por rol') };
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

// --- Derivados ------------------------------------------------------------------------------------
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
  criticas: defects.filter((d) => sevKey(d.severidad) === 'critica').map((d) => d.id),
  graves: defects.filter((d) => ['alta', 'media'].includes(sevKey(d.severidad))).map((d) => d.id),
  menores: defects.filter((d) => sevKey(d.severidad) === 'menor').map((d) => d.id),
  limite: minorLimit,
};
gate.abierta = gate.criticas.length + gate.graves.length === 0 && gate.menores.length <= minorLimit;
const EXEMPT = new Set(['BUG', 'ST', 'CH', 'SP']);
for (const it of items) {
  it.lista = !it.hecho && !OFF.has(lc(it.estado)) && it.pendientes.length === 0;
  it.frenadaPorCompuerta = it.lista && !gate.abierta && !EXEMPT.has(it.prefijo) && lc(it.estado) === 'draft';
}
// Siguiente: lo que ya está en curso; si la compuerta está cerrada, sus defectos; si no, lo listo por
// prioridad, release y orden del backlog.
const prio = (p) => { const m = /P(\d)/i.exec(p); return m ? Number(m[1]) : 9; };
const relRank = (r) => { const i = releases.findIndex((x) => x.id === r); return i < 0 ? 99 : i; };
const rank = (a, b) => prio(a.prioridad) - prio(b.prioridad) || relRank(a.release) - relRank(b.release) || a.order - b.order;
const enCurso = items.filter((i) => ACTIVE.has(lc(i.estado))).sort(rank);
const listas = items.filter((i) => i.lista && !ACTIVE.has(lc(i.estado)) && !i.frenadaPorCompuerta).sort(rank);
let siguiente = null; let motivo = '';
if (gate.criticas.length) { siguiente = byId.get(gate.criticas[0]); motivo = 'Hay un defecto Crítico abierto: solo se trabaja en su corrección.'; }
else if (enCurso.length) { siguiente = enCurso[0]; motivo = `Ya está ${siguiente.estado === 'In Review' ? 'en revisión' : 'en curso'}: termínalo antes de empezar otro (un elemento por sesión).`; }
else if (!gate.abierta) {
  siguiente = listas.find((i) => i.prefijo === 'ST') ?? listas.find((i) => i.severidad) ?? null;
  motivo = 'La compuerta de estabilización está cerrada: ninguna historia nueva pasa a Ready hasta corregir defectos.';
} else if (listas.length) {
  siguiente = listas[0];
  motivo = [siguiente.requiere.length ? `Sus requisitos (${siguiente.requiere.join(', ')}) ya están aceptados.` : 'No depende de nada.',
    siguiente.prioridad && `Prioridad ${siguiente.prioridad}`, siguiente.release && `del ${siguiente.release}`].filter(Boolean).join(' ').replace(/ (del)/, ', $1') + '.';
}
const phrase = (it) => {
  if (!it) return '';
  if (gate.menores.length + gate.graves.length && it.severidad && !gate.abierta) return `Hagamos un lote de estabilización con ${[...gate.criticas, ...gate.graves, ...gate.menores].join(', ')}`;
  if (ACTIVE.has(lc(it.estado))) return `Continuemos ${it.id} con aes-cycle`;
  return { BUG: `Corrijamos ${it.id} con aes-cycle`, SP: `Investiguemos ${it.id} con aes-cycle`, ST: `Hagamos el lote ${it.id} con aes-cycle`, CH: `Hagamos el chore ${it.id} con aes-cycle` }[it.prefijo] ?? `Avancemos ${it.id} con aes-cycle`;
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
const project = (titleM?.[1] ?? '').replace(/^Backlog\s*[—-]\s*/i, '').replace(/\s*\(.*\)$/, '').trim() || 'Backlog';
const target = out ?? '.aes/board.html';
const data = {
  base: relative(dirname(resolve(target)), root).replace(/\\/g, '/') || '.', project, vision: visionM?.[1]?.trim() ?? '', generado: new Date().toISOString(), fuente: src,
  gate, siguiente: siguiente?.id ?? null, motivo, frase: siguiente ? siguiente.frase : '', alternativas,
  releases, epics, items, totales: { runsUsd: Object.values(runs).reduce((n, r) => n + r.usd, 0) },
};
const html = readFileSync(new URL('./aes-board.html', import.meta.url), 'utf8')
  .replace('/*__AES_DATA__*/null', () => JSON.stringify(data).replace(/</g, '\\u003c'))
  .replace('<title>Backlog</title>', () => `<title>Backlog · ${project.replace(/[<&]/g, '')}</title>`);
mkdirSync(dirname(resolve(target)), { recursive: true });
writeFileSync(target, html);
console.log(`Tablero: ${target} (${pathToFileURL(resolve(target)).href})`);
