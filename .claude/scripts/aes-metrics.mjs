#!/usr/bin/env node
// AES 2.1 — An item's metrics from the records, so the orchestrator does not compute them by hand (09 §6).
//
// It reads what the scripts already record and prints the item's metrics row (and, with --write,
// appends it to the "Metrics per item" table of docs/harness-findings.md):
//   - OpenCode runs: .aes/runs/<branch>/*.jsonl (duration, model time vs command time, tokens/s) and
//     .aes/costs.csv (tokens and estimated USD per role and model);
//   - CI: with --ci, the durations of the workflow runs of the item's branches (gh run list);
//   - start: --start, or else the first note of the item in .aes/findings-pending.md; end: now.
// What only the harness or the human knows is passed as arguments: Claude's cost (/cost or the usage
// page), the Claude models per role, FAIL cycles, interventions and blocks.
//
// Usage:
//   node .claude/scripts/aes-metrics.mjs <ID> [--ci] [--write]
//        [--start "YYYY-MM-DD HH:MM"] [--claude "<cost text>"] [--models "<Claude role: model; …>"]
//        [--fail "<text>"] [--interventions "<text>"] [--blocks "<text>"] [--api "<API time>"]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--') && /^[A-Z]{2,4}-\d+$/.test(a));
if (!id) { console.error('Usage: aes-metrics.mjs <ID> [--ci] [--write] [--start …] [--claude …] [--models …] [--fail …] [--interventions …] [--blocks …] [--api …]'); process.exit(2); }
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] ?? '') : ''; };
const flag = (name) => args.includes(`--${name}`);

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const read = (p) => { try { return fs.readFileSync(path.join(root, p), 'utf8'); } catch { return ''; } };
const env = read('.claude/aes.env');
const lang = env.match(/^AES_LANG="?(es|en)/m)?.[1] ?? 'en';
const T = {
  en: { runs: 'OpenCode runs', total: 'Total', model: 'Model', cmds: 'Commands', out: 'Output', tps: 'Model tok/s', ci: 'CI runs', none: '(none)',
        cols: ['Item', 'Start', 'End', 'Actual model per role', 'FAIL cycles', 'Human interventions', 'Blocks (hooks / permissions / classifier)', 'Cost', 'API time', 'Total time'],
        heading: /^##\s+(Metrics per item|M[eé]tricas por elemento)/i, appended: 'Row appended to' },
  es: { runs: 'Corridas de OpenCode', total: 'Total', model: 'Modelo', cmds: 'Comandos', out: 'Salida', tps: 'Tokens/s del modelo', ci: 'Corridas de la CI', none: '(ninguna)',
        cols: ['Elemento', 'Inicio', 'Fin', 'Modelo real por rol', 'Ciclos FAIL', 'Intervenciones humanas', 'Bloqueos (hooks / permisos / clasificador)', 'Costo', 'Tiempo de API', 'Tiempo total'],
        heading: /^##\s+(M[eé]tricas por elemento|Metrics per item)/i, appended: 'Fila agregada a' },
}[lang];
const min = (ms) => `${(ms / 60000).toFixed(1)} min`;
const hm = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const stamp = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// --- OpenCode runs ---------------------------------------------------------------------------------
const runsDir = path.join(root, '.aes/runs');
const runs = [];
if (fs.existsSync(runsDir)) {
  for (const dir of fs.readdirSync(runsDir)) {
    if (!new RegExp(`(^|-)${id}(-|$)`).test(dir)) continue;
    for (const f of fs.readdirSync(path.join(runsDir, dir)).filter((n) => n.endsWith('.jsonl')).sort()) {
      const ev = fs.readFileSync(path.join(runsDir, dir, f), 'utf8').split('\n')
        .filter((l) => l.startsWith('{')).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const ts = ev.map((e) => e.timestamp).filter(Number.isFinite);
      if (!ts.length) continue;
      let modelMs = 0, out = 0, open = null;
      for (const e of ev) {
        if (e.type === 'step_start' && Number.isFinite(e.timestamp)) open = e.timestamp;
        if (e.type === 'step_finish') {
          if (open != null && Number.isFinite(e.timestamp)) modelMs += e.timestamp - open;
          open = null; out += (e.part?.tokens?.output ?? 0) + (e.part?.tokens?.reasoning ?? 0);
        }
      }
      const total = Math.max(...ts) - Math.min(...ts);
      runs.push({ name: `${dir}/${f.replace(/\.jsonl$/, '')}`, first: Math.min(...ts), total, modelMs, out });
    }
  }
}

// --- Costs per role (aes-oc.sh) --------------------------------------------------------------------
const roles = new Map();
let ocUsd = 0;
for (const line of read('.aes/costs.csv').split('\n').slice(1)) {
  const c = line.split(',');
  if (c[1] !== id) continue;
  const key = `${c[3]} ${c[4]}`;
  const r = roles.get(key) ?? { role: c[3], model: c[4], runs: 0, usd: 0 };
  r.runs++; r.usd += Number(c[12]) || 0; ocUsd += Number(c[12]) || 0; roles.set(key, r);
}

// --- CI --------------------------------------------------------------------------------------------
const ci = [];
if (flag('ci')) {
  try {
    const gh = fs.existsSync(path.join(root, '.claude/scripts/agent-gh.sh')) ? ['bash', ['.claude/scripts/agent-gh.sh']] : ['gh', []];
    const outJson = execFileSync(gh[0], [...gh[1], 'run', 'list', '--limit', '200', '--json', 'headBranch,createdAt,updatedAt,conclusion,event'], { cwd: root, encoding: 'utf8' });
    for (const r of JSON.parse(outJson)) {
      if (!new RegExp(`(^|/)${id}(/|-|$)`).test(r.headBranch ?? '')) continue;
      ci.push({ branch: r.headBranch, ms: new Date(r.updatedAt) - new Date(r.createdAt), conclusion: r.conclusion });
    }
  } catch (e) { console.error(`CI: ${String(e.message).split('\n')[0]}`); }
}

// --- Start and end ---------------------------------------------------------------------------------
let start = opt('start');
if (!start) {
  const notes = read('.aes/findings-pending.md').split('\n').filter((l) => l.startsWith('|') && l.includes(id));
  start = notes.map((l) => l.split('|')[1].trim()).filter((s) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)).sort()[0] ?? '';
}
if (!start && runs.length) start = stamp(new Date(Math.min(...runs.map((r) => r.first))));
const end = stamp(new Date());
const totalMs = start ? new Date() - new Date(start.replace(' ', 'T')) : 0;

// --- Output ----------------------------------------------------------------------------------------
console.log(`${T.runs}:`);
if (!runs.length) console.log(`  ${T.none}`);
for (const r of runs) {
  const tps = r.modelMs > 0 ? Math.round(r.out / (r.modelMs / 1000)) : 0;
  console.log(`  ${r.name}: ${T.total} ${min(r.total)} · ${T.model} ${min(r.modelMs)} · ${T.cmds} ${min(r.total - r.modelMs)} · ${T.out} ${r.out} · ${T.tps} ${tps}`);
}
const ocTotal = runs.reduce((a, r) => a + r.total, 0), ocModel = runs.reduce((a, r) => a + r.modelMs, 0);
if (runs.length) console.log(`  ${T.total}: ${min(ocTotal)} (${T.cmds.toLowerCase()} ${min(ocTotal - ocModel)}, ${T.model.toLowerCase()} ${min(ocModel)})`);
if (flag('ci')) {
  const ciMs = ci.reduce((a, r) => a + r.ms, 0);
  console.log(`${T.ci}: ${ci.length} · ${min(ciMs)}${ci.filter((r) => r.conclusion === 'failure').length ? ` · failure: ${ci.filter((r) => r.conclusion === 'failure').length}` : ''}`);
}

const ocModels = [...roles.values()].map((r) => `${r.role} opencode ${r.model} (${r.runs})`).join('; ');
const models = [opt('models'), ocModels].filter(Boolean).join('; ');
const ocCost = roles.size ? `OpenCode USD ${ocUsd.toFixed(4)} (${[...roles.values()].map((r) => `${r.role} ${r.usd.toFixed(4)}`).join('; ')})` : '';
const cost = [opt('claude') && `Claude ${opt('claude')}`, ocCost].filter(Boolean).join(' · ');
const api = [opt('api'), runs.length && `OpenCode ${min(ocTotal)} (${T.model.toLowerCase()} ${min(ocModel)})`, flag('ci') && `CI ${min(ci.reduce((a, r) => a + r.ms, 0))}`].filter(Boolean).join('; ');
const cells = [id, start || '—', end, models || '—', opt('fail') || '—', opt('interventions') || '—', opt('blocks') || '—', cost || '—', api || '—', totalMs ? hm(totalMs) : '—'];
const row = `| ${cells.map((c) => String(c).replace(/\|/g, '\\|')).join(' | ')} |`;
console.log(`\n| ${T.cols.join(' | ')} |\n${row}`);

if (flag('write')) {
  const file = path.join(root, 'docs/harness-findings.md');
  const lines = (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '').split('\n');
  const h = lines.findIndex((l) => T.heading.test(l));
  if (h < 0) { console.error(`docs/harness-findings.md has no "Metrics per item" section.`); process.exit(1); }
  let i = h + 1;
  while (i < lines.length && !lines[i].startsWith('|')) i++;
  while (i < lines.length && lines[i].startsWith('|')) i++;
  lines.splice(i, 0, row);
  fs.writeFileSync(file, lines.join('\n'));
  console.log(`${T.appended} docs/harness-findings.md`);
}
