// AES — Check of confirmed RED (AES 05 §2.2) and of traceability (03 §6), layer L3.
//
// Reads the Playwright JSON report of ONE story's tests run against the current
// code and requires that:
//   1. tests RAN (a build or configuration error is not RED);
//   2. none passes (a test that passes against the base does not test the new functionality);
//   3. none is skipped (skip/fixme).
// Exception: "bootstrap RED". If the base has no application code yet (initial
// enabler), it is accepted that no test runs because the servers do not start.
//
// Traceability (optional, if the item's specification is passed): each test must start its
// title with a criterion ID (AC-NN) or a defect ID (BUG-NNN) that exists in the specification's
// table, and carry its tag (@<ID>-AC-NN or @BUG-NNN). A test without an approved criterion
// is not accepted (FL-001 in the sandbox).
//
// Usage: node red-check.mjs <report.json> <item-ID> <bootstrap: 0|1> [<specification.md>]
// It prints a table test → status → first line of the error, so that the human can check
// that each test fails for the expected reason.
import { readFileSync, existsSync } from 'node:fs';

const [reportPath, story, bootstrapArg, specPath] = process.argv.slice(2);
const bootstrap = bootstrapArg === '1';
const fail = (msg) => { console.log(`::error::${msg}`); process.exit(1); };
const ok = (msg) => { console.log(msg); process.exit(0); };

let report = null;
if (reportPath && existsSync(reportPath)) {
  try { report = JSON.parse(readFileSync(reportPath, 'utf8')); } catch { report = null; }
}

const tests = [];
const walk = (suite, parents = []) => {
  const path = suite.title ? [...parents, suite.title] : parents;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const results = t.results ?? [];
      const last = results[results.length - 1];
      const message = (last?.error?.message ?? last?.errors?.[0]?.message ?? '')
        .replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim()) ?? '';
      const tags = [...(spec.tags ?? []), ...(t.tags ?? [])].map((x) => (x.startsWith('@') ? x : `@${x}`));
      tests.push({ title: spec.title, tags, status: last?.status ?? 'notRun', outcome: t.status, message: message.trim() });
    }
  }
  for (const child of suite.suites ?? []) walk(child, path);
};
for (const s of report?.suites ?? []) walk(s);

const globalErrors = (report?.errors ?? []).map((e) =>
  (e.message ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim()) ?? '');
const executed = tests.filter((t) => t.status !== 'notRun' && t.status !== 'skipped');

console.log(`Item: @${story} | tests found: ${tests.length} | run: ${executed.length}`);
for (const t of tests) console.log(`  - [${t.status}] ${t.title}${t.message ? `  →  ${t.message.slice(0, 160)}` : ''}`);
for (const e of globalErrors) console.log(`  ! global error: ${e.slice(0, 200)}`);

// Traceability: before RED, because a test without a criterion must not reach review.
if (specPath) {
  if (!existsSync(specPath)) fail(`The specification ${specPath} does not exist, so traceability cannot be checked.`);
  const spec = readFileSync(specPath, 'utf8');
  const ids = new Set([...spec.matchAll(/^\|\s*`?((?:AC|BUG)-\d+)`?\s*\|/gm)].map((m) => m[1]));
  if (ids.size === 0) fail(`The specification ${specPath} has no criteria table (rows "| AC-NN |" or "| BUG-NNN |").`);
  const problems = [];
  for (const t of tests) {
    const id = t.title.match(/^((?:AC|BUG)-\d+)\b/)?.[1];
    if (!id) { problems.push(`"${t.title}": the title does not start with a criterion ID`); continue; }
    if (!ids.has(id)) { problems.push(`"${t.title}": ${id} does not exist in the specification`); continue; }
    const tag = id.startsWith('BUG-') ? `@${id}` : `@${story}-${id}`;
    if (t.tags.length && !t.tags.includes(tag)) problems.push(`"${t.title}": the tag ${tag} is missing`);
  }
  if (problems.length) fail(`Traceability: ${problems.length} test(s) without an approved criterion or without a tag:\n  ${problems.join('\n  ')}`);
  console.log(`Traceability OK: ${tests.length} tests, all with a criterion from ${specPath}.`);
}

if (executed.length === 0) {
  if (bootstrap) {
    ok(`Bootstrap RED accepted: the base has no application code yet and no test got to run${globalErrors.length ? ` (${globalErrors[0].slice(0, 120)})` : ''}.`);
  }
  fail(`No test of @${story} got to run. A build, configuration or startup error does not show RED. Check the global errors.`);
}

const passed = tests.filter((t) => t.status === 'passed');
if (passed.length) {
  fail(`These tests PASS against the current code, so they do not test the new functionality: ${passed.map((t) => `"${t.title}"`).join(', ')}`);
}

const skipped = tests.filter((t) => t.status === 'skipped');
if (skipped.length) {
  fail(`There are skipped tests (skip/fixme) in @${story}: ${skipped.map((t) => `"${t.title}"`).join(', ')}`);
}

const notRun = tests.filter((t) => t.status === 'notRun');
if (notRun.length) {
  fail(`Some tests did not get to run: ${notRun.map((t) => `"${t.title}"`).join(', ')}`);
}

ok(`RED confirmed: the ${executed.length} tests of @${story} ran and failed. Check above that each one fails for the expected reason.`);
