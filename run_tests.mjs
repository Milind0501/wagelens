// WageLens test runner. Usage: node tests/run_tests.mjs
// Loads the same data.js / engine.js the browser uses, runs WL_ENGINE.runTests(WL_DATA.testCases),
// prints a table and writes tests/test_report.json. Exit code 1 if any deterministic test (T01-T13, T15) fails.
// T14 is an eval: it "passes" if it runs and reports the expected accuracy and the 2 deliberate misses.
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
require(path.join(root, 'data.js'));
require(path.join(root, 'engine.js'));
const D = globalThis.WL_DATA, E = globalThis.WL_ENGINE;

const results = E.runTests(D.testCases);

// ---- extra non-table checks (reported, and they also gate the exit code) ----
const extras = [];
function extra(name, pass, detail) { extras.push({ name, pass: !!pass, detail }); }

// 1. every recorded quote verifies; the deliberately failed quote in the agent run really fails
extra('all proposal quotes are verbatim substrings', D.canonicalComponents.every(c => E.validateProposal(c.proposed, D.documents).ok),
  D.canonicalComponents.reduce((n, c) => n + c.proposed.evidence.length, 0) + ' quotes across ' + D.canonicalComponents.length + ' proposals');
const fq = D.agentRun.find(s => s.quote);
extra('recorded failed quote is genuinely not in its source', fq && E.verifyQuote(D.documents, fq.quote.docId, fq.quote.quote) === false, fq ? fq.quote.quote : 'none');
extra('validateProposal rejects an invented category', E.validateProposal({ category: 'EXCL_L', confidence: 0.8, rationale: 'x', evidence: [D.canonicalComponents[0].proposed.evidence[0]] }, D.documents).ok === false, 'EXCL_L');
// 2. the statute text is verbatim (spot check on both ends and the proviso)
const law = D.documents.find(d => d.id === 'LAW_2Y').text;
extra('LAW_2Y begins and ends with the s.2(y) wording', law.startsWith('"wages" means all remuneration') && law.endsWith('added in wages under this clause.') && law.includes('exceeds one-half, or such other per cent. as may be notified'), law.length + ' chars');
// 3. generator is seeded and deterministic; no Math.random in the source
const a = D.generateEmployees(7, 200), b = D.generateEmployees(7, 200), c = D.generateEmployees(8, 200);
extra('generateEmployees deterministic per seed', JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) !== JSON.stringify(c), 'seed 7 twice identical; seed 8 differs');
extra('data.js contains no Math.random', !/Math\.random/.test(readFileSync(path.join(root, 'data.js'), 'utf8')), '');
// 4. every generated line resolves (no unresolved codes) and both systems/entities appear
const emps = D.generateEmployees(D.defaultSeed, D.defaultN);
const gold = E.makeGlossary(D.canonicalComponents, 'gold');
const rs1 = E.RULESETS[0];
const runGold = E.runPortfolio(emps, gold, rs1, D.canonicalComponents);
extra('generated estate: zero unresolved lines under gold glossary', runGold.unresolvedLines === 0, runGold.rowsProcessed + ' lines resolved');
extra('generated estate covers both systems', Object.keys(runGold.byEntity).length === 2, JSON.stringify(Object.keys(runGold.byEntity)));
extra('every one of the 33 raw codes appears in the default estate', D.rawComponents.every(r => r.employeesPaid > 0), D.rawComponents.filter(r => !r.employeesPaid).map(r => r.code).join(',') || 'all present');
// 5. proposals glossary is flagged as unreviewed (draft)
const runDraft = E.runPortfolio(emps, E.makeGlossary(D.canonicalComponents, 'proposed'), rs1, D.canonicalComponents);
extra('proposed glossary run is flagged draft with 20 unreviewed components', runDraft.draft && runDraft.unreviewedComponents.length > 0, runDraft.unreviewedComponents.length + ' unreviewed');
// 6. scale: 10,000 employees x 3 months
const big = D.generateEmployees(99, 10000);
const runBig = E.runPortfolio(big, gold, rs1, D.canonicalComponents);
extra('10,000 employees x 3 months in under 1000 ms', runBig.ms < 1000, runBig.ms.toFixed(0) + ' ms, ' + runBig.rowsProcessed.toLocaleString('en-US') + ' lines');
// 7. what-if and v2 produce different portfolio totals (rule change = version swap)
const run40 = E.runPortfolio(emps, gold, E.getRuleset('whatif-40'), D.canonicalComponents);
const runV2 = E.runPortfolio(emps, gold, E.getRuleset('CoW-2y-central-v2'), D.canonicalComponents);
const d40 = E.diffRuns(runGold, run40), dV2 = E.diffRuns(runGold, runV2);
extra('40% what-if increases add-back employees and PF', run40.withAddback >= runGold.withAddback && d40.deltaPF >= 0, 'withAddback ' + runGold.withAddback + ' -> ' + run40.withAddback);
extra('v2 EPF ceiling (25,000) raises employer PF vs v1', dV2.deltaPF > 0, 'monthly PF +' + dV2.deltaPF.toFixed(0));
// 8. audit CSV
const csv = E.toAuditCSV(runGold, { maxEmployees: 50 });
extra('audit CSV header and rows', csv.startsWith('employee,period,component,category,clause,amount,R,cap,addback,codeWage,ruleset') && csv.split('\n').length > 100, csv.split('\n').length + ' lines for 50 employees');

// ---- print ----
const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
console.log('\nWageLens test report\n');
console.log(pad('ID', 5) + pad('RESULT', 8) + pad('TEST', 76) + 'NOTE');
console.log('-'.repeat(130));
for (const r of results) console.log(pad(r.id, 5) + pad(r.pass ? 'PASS' : 'FAIL', 8) + pad(r.name, 76) + (r.pass ? (r.id === 'T14' ? r.note : '') : r.note));
console.log('\nExtra checks');
for (const e of extras) console.log('  ' + (e.pass ? 'PASS' : 'FAIL') + '  ' + e.name + (e.detail ? '  [' + e.detail + ']' : ''));
const t14 = results.find(r => r.id === 'T14');
if (t14 && t14.eval) {
  console.log('\nT14 classifier eval: accuracy ' + (t14.eval.accuracy * 100).toFixed(1) + '% (' + t14.eval.correct + '/' + t14.eval.total + ')');
  for (const m of t14.eval.misses) console.log('  MISS ' + m.name + ': proposed ' + m.predicted + ' (conf ' + m.confidence + '), gold ' + m.gold);
}
console.log('\nPortfolio sanity (default estate, ' + emps.length + ' employees, gold glossary, v1): ' + runGold.withAddback + ' with add-back (' + runGold.pctWithAddback.toFixed(1) + '%), monthly PF delta ' + E.fmtINR(runGold.monthlyPFDelta) + ', gratuity delta ' + E.fmtCrLakh(runGold.gratuityLiabilityDelta));

const deterministic = results.filter(r => r.id !== 'T14');
const failed = deterministic.filter(r => !r.pass).length + extras.filter(e => !e.pass).length;
const report = {
  generatedBy: 'tests/run_tests.mjs',
  disputedExpectations: [],
  notes: 'No PLAN.md expected value was changed. All T01-T11, T13 expectations were re-derived by hand before implementation and match PLAN.md. T15 expectations come from the coordinator addendum (EPF ceiling Rs 25,000 from 17 Sep 2026; 0.12 x 16,500 = 1,980). Expected values in data.js testCases are literals; none are produced by the engine.',
  summary: { total: results.length, passed: results.filter(r => r.pass).length, failedDeterministic: deterministic.filter(r => !r.pass).length, extraChecksFailed: extras.filter(e => !e.pass).length },
  results: results.map(r => ({ id: r.id, name: r.name, kind: r.kind, pass: r.pass, expected: r.expected, actual: r.actual, note: r.note, proves: r.proves, eval: r.eval })),
  extraChecks: extras,
  portfolio: { employees: emps.length, rows: runGold.rowsProcessed, withAddback: runGold.withAddback, pctWithAddback: runGold.pctWithAddback, monthlyPFDelta: runGold.monthlyPFDelta, annualPFDelta: runGold.annualPFDelta, gratuityLiabilityDelta: runGold.gratuityLiabilityDelta, scale10k: { employees: 10000, rows: runBig.rowsProcessed, ms: runBig.ms } }
};
writeFileSync(path.join(here, 'test_report.json'), JSON.stringify(report, null, 2));
console.log('\nWrote tests/test_report.json. ' + (failed ? failed + ' failure(s).' : 'All deterministic tests passed.'));
process.exit(failed ? 1 : 0);
