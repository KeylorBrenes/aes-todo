#!/usr/bin/env node
// AES 1.5.1 — Vistas del backlog (standard/02 §11).
//
// El backlog vive en un archivo (docs/backlog.md) y es la única fuente de verdad. Este script
// genera vistas en una sola dirección:
//   - un tablero HTML autocontenido (sin ningún servicio), por defecto en .aes/board.html;
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
import { dirname, resolve, join } from 'node:path';
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

const COLS = {
  id: ['id'], tipo: ['tipo', 'type'], titulo: ['título', 'titulo', 'title'],
  requiere: ['requiere', 'requires'], puntos: ['puntos', 'points', 'pts'],
  prioridad: ['prioridad', 'priority'], severidad: ['severidad', 'severity'], estado: ['estado', 'status'],
  epic: ['epic', 'épica', 'epica'], release: ['release'],
};
const STATES = ['Draft', 'Ready', 'In Progress', 'In Review', 'Blocked', 'Ready for Acceptance', 'Accepted', 'Released', 'Deferred', 'Rejected'];
const DONE = new Set(['accepted', 'released']);

function parse(md) {
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|')) continue;
    const head = lines[i].split('|').slice(1, -1).map((h) => h.trim().replace(/[`*]/g, '').toLowerCase());
    const idx = {};
    for (const [k, names] of Object.entries(COLS)) idx[k] = head.findIndex((h) => names.includes(h));
    if (idx.id < 0 || idx.titulo < 0 || idx.estado < 0) continue;
    const items = [];
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      const cells = lines[j].split('|').slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, ''));
      const get = (k) => (idx[k] >= 0 ? (cells[idx[k]] ?? '').trim() : '');
      const clean = (v) => (v === '—' || v === '-' ? '' : v);
      const id = get('id');
      if (!id) continue;
      items.push({
        id, tipo: clean(get('tipo')), titulo: get('titulo'), puntos: clean(get('puntos')),
        prioridad: clean(get('prioridad')), severidad: clean(get('severidad')), estado: get('estado') || 'Draft',
        epic: clean(get('epic')), release: clean(get('release')),
        requiere: clean(get('requiere')).split(/[,\s]+/).filter(Boolean),
      });
    }
    return items;
  }
  throw new Error(`No se encontró en ${src} una tabla con las columnas ID, Título y Estado (AES 02 §11).`);
}

const items = parse(readFileSync(src, 'utf8'));
const byId = new Map(items.map((it) => [it.id, it]));
for (const it of items) {
  it.pendientes = it.requiere.filter((r) => !DONE.has((byId.get(r)?.estado ?? '').toLowerCase()));
}

if (json) {
  const text = JSON.stringify({ source: src, generatedAt: new Date().toISOString(), states: STATES, items }, null, 2);
  if (out) { mkdirSync(dirname(resolve(out)), { recursive: true }); writeFileSync(out, text); console.log(out); }
  else console.log(text);
  process.exit(0);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const known = new Set(STATES.map((s) => s.toLowerCase()));
const columns = [...STATES, ...new Set(items.map((i) => i.estado).filter((e) => !known.has(e.toLowerCase())))];
const card = (it) => `
      <article data-rel="${esc(it.release)}" class="card${it.pendientes.length && !DONE.has(it.estado.toLowerCase()) ? ' waiting' : ''}">
        <header><span class="id">${esc(it.id)}</span>${it.tipo ? `<span class="tag">${esc(it.tipo)}</span>` : ''}${it.severidad ? `<span class="sev sev-${esc(it.severidad.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))}">${esc(it.severidad)}</span>` : ''}</header>
        <p>${esc(it.titulo)}</p>
        <footer>${it.puntos ? `<span>${esc(it.puntos)} pts</span>` : ''}${it.prioridad ? `<span>${esc(it.prioridad)}</span>` : ''}${it.release ? `<span>${esc(it.release)}</span>` : ''}${it.epic ? `<span title="Epic">${esc(it.epic)}</span>` : ''}${it.requiere.length ? `<span title="Requiere">↳ ${it.requiere.map((r) => (it.pendientes.includes(r) ? `<b>${esc(r)}</b>` : esc(r))).join(', ')}</span>` : ''}</footer>
      </article>`;
const cols = columns.map((st) => {
  const list = items.filter((i) => i.estado.toLowerCase() === st.toLowerCase());
  if (!list.length && ['Deferred', 'Rejected', 'Blocked', 'Ready for Acceptance'].includes(st)) return '';
  return `
    <section class="col"><h2>${esc(st)} <small>${list.length}</small></h2>${list.map(card).join('')}
    </section>`;
}).join('');
const total = (f) => items.filter(f).reduce((n, i) => n + (Number(i.puntos) || 0), 0);
const releases = [...new Set(items.map((i) => i.release).filter(Boolean))].sort();
const relSummary = releases.map((r) => {
  const of = (i) => i.release === r;
  return `<span>${esc(r)}: ${total((i) => of(i) && DONE.has(i.estado.toLowerCase()))}/${total(of)} pts</span>`;
}).join('');
const relFilter = releases.length ? `<label>Release <select id="rel"><option value="">Todos</option>${releases.map((r) => `<option>${esc(r)}</option>`).join('')}</select></label>` : '';
const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Backlog</title>
<style>
  :root { --bg:#f6f7f9; --col:#eceef2; --card:#fff; --fg:#1d2330; --muted:#677084; --line:#d9dde5; --wait:#b45309; }
  @media (prefers-color-scheme: dark) { :root { --bg:#14171d; --col:#1c2028; --card:#252a34; --fg:#e7eaf0; --muted:#9aa3b5; --line:#343a46; --wait:#f59e0b; } }
  * { box-sizing:border-box } body { margin:0; font:14px/1.4 system-ui,sans-serif; background:var(--bg); color:var(--fg) }
  header.top { padding:16px 20px; display:flex; gap:24px; align-items:baseline; flex-wrap:wrap }
  header.top h1 { font-size:18px; margin:0 } header.top span { color:var(--muted) }
  main { display:flex; gap:12px; padding:0 20px 20px; overflow-x:auto; align-items:flex-start }
  .col { background:var(--col); border-radius:10px; padding:10px; min-width:250px; max-width:280px; flex:0 0 auto }
  .col h2 { font-size:13px; margin:2px 4px 10px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted) }
  .card { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:8px 10px; margin-bottom:8px }
  .card.waiting { border-left:3px solid var(--wait) }
  .card header { display:flex; gap:6px; align-items:center; flex-wrap:wrap } .id { font-weight:600 }
  .tag, .sev { font-size:11px; padding:1px 6px; border-radius:999px; border:1px solid var(--line); color:var(--muted) }
  .sev-critica { background:#b91c1c; color:#fff; border-color:#b91c1c } .sev-alta { background:#ea580c; color:#fff; border-color:#ea580c }
  .sev-media { background:#ca8a04; color:#fff; border-color:#ca8a04 }
  .card p { margin:6px 0 } .card footer { display:flex; gap:10px; flex-wrap:wrap; color:var(--muted); font-size:12px } .card footer b { color:var(--wait) }
</style></head><body>
<header class="top"><h1>Backlog</h1>
  <span>${items.length} elementos · ${total(() => true)} pts · ${total((i) => DONE.has(i.estado.toLowerCase()))} pts terminados</span>
  ${relSummary}${relFilter}
  <span>Generado desde ${esc(src)} el ${esc(new Date().toLocaleString('es'))}. Solo lectura: los cambios se hacen en el archivo, por PR.</span>
</header>
<main>${cols}
</main>${releases.length ? `
<script>
  document.getElementById('rel').addEventListener('change', (e) => {
    for (const c of document.querySelectorAll('.card')) c.hidden = !!e.target.value && c.dataset.rel !== e.target.value;
  });
</script>` : ''}</body></html>
`;
const target = out ?? '.aes/board.html';
mkdirSync(dirname(resolve(target)), { recursive: true });
writeFileSync(target, html);
console.log(`Tablero: ${target} (${pathToFileURL(resolve(target)).href})`);
