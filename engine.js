/* WageLens deterministic engine. Plain browser JS, also loads in Node.
 * Exposes window.WL_ENGINE (or globalThis.WL_ENGINE in Node).
 * AI never touches rows: this file is the only thing that computes money.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- categories
  const CATEGORIES = {
    WAGE_CORE:  { id: 'WAGE_CORE',  label: 'Core wage (basic / DA / retaining)', short: 'Core wage',   clause: 's.2(y)(i)-(iii)', inCap: false, countsAsWage: true,  color: '#0f766e', token: 'cat-core' },
    WAGE_OTHER: { id: 'WAGE_OTHER', label: 'Other remuneration (counts as wages)', short: 'Other wage', clause: 's.2(y) main part', inCap: false, countsAsWage: true,  color: '#0e7490', token: 'cat-other' },
    EXCL_A:     { id: 'EXCL_A',     label: 'Bonus payable under law (not part of contract pay)', short: 'Statutory bonus', clause: 's.2(y)(a)', inCap: true,  countsAsWage: false, color: '#b45309', token: 'cat-excl-a' },
    EXCL_B:     { id: 'EXCL_B',     label: 'House accommodation / amenity value', short: 'Housing value', clause: 's.2(y)(b)', inCap: true,  countsAsWage: false, color: '#a16207', token: 'cat-excl-b' },
    EXCL_C:     { id: 'EXCL_C',     label: 'Employer pension / provident fund contribution', short: 'Employer PF', clause: 's.2(y)(c)', inCap: true,  countsAsWage: false, color: '#7c3aed', token: 'cat-excl-c' },
    EXCL_D:     { id: 'EXCL_D',     label: 'Conveyance allowance / travel concession', short: 'Conveyance / LTA', clause: 's.2(y)(d)', inCap: true,  countsAsWage: false, color: '#c2410c', token: 'cat-excl-d' },
    EXCL_E:     { id: 'EXCL_E',     label: 'Sum paid to defray special expenses of the job', short: 'Special expenses', clause: 's.2(y)(e)', inCap: true,  countsAsWage: false, color: '#be123c', token: 'cat-excl-e' },
    EXCL_F:     { id: 'EXCL_F',     label: 'House rent allowance', short: 'HRA', clause: 's.2(y)(f)', inCap: true,  countsAsWage: false, color: '#9333ea', token: 'cat-excl-f' },
    EXCL_G:     { id: 'EXCL_G',     label: 'Remuneration under award / settlement / court order', short: 'Award / settlement', clause: 's.2(y)(g)', inCap: true,  countsAsWage: false, color: '#4f46e5', token: 'cat-excl-g' },
    EXCL_H:     { id: 'EXCL_H',     label: 'Overtime allowance', short: 'Overtime', clause: 's.2(y)(h)', inCap: true,  countsAsWage: false, color: '#db2777', token: 'cat-excl-h' },
    EXCL_I:     { id: 'EXCL_I',     label: 'Commission payable to the employee', short: 'Commission', clause: 's.2(y)(i)', inCap: true,  countsAsWage: false, color: '#e11d48', token: 'cat-excl-i' },
    EXCL_J:     { id: 'EXCL_J',     label: 'Gratuity payable on termination (outside the cap)', short: 'Gratuity payout', clause: 's.2(y)(j)', inCap: false, countsAsWage: false, color: '#475569', token: 'cat-excl-j' },
    EXCL_K:     { id: 'EXCL_K',     label: 'Retrenchment comp / retirement benefit / ex gratia on termination (outside the cap)', short: 'Termination benefits', clause: 's.2(y)(k)', inCap: false, countsAsWage: false, color: '#64748b', token: 'cat-excl-k' },
    OUTSIDE:    { id: 'OUTSIDE',    label: 'Reimbursement of actual expenses against bills (not remuneration)', short: 'Reimbursement', clause: 'outside s.2(y) (not remuneration)', inCap: false, countsAsWage: false, color: '#6b7280', token: 'cat-outside' }
  };
  const CATEGORY_IDS = Object.keys(CATEGORIES);

  // ---------------------------------------------------------------- rulesets
  const BASE_RS = {
    version: 'v1',
    effectiveFrom: '2025-11-21',
    threshold: 0.5,
    includeEmployerPFInRemuneration: true,
    pfRate: 0.12,
    pfCeiling: 15000,
    gratuityDays: 15,
    gratuityDivisor: 26,
    gratuityCap: 2000000,
    hypothetical: false
  };
  const CITE_COMMON = {
    threshold: 'Code on Wages 2019, s.2(y) proviso: payments under clauses (a)-(i) above one-half of all remuneration are added back to wages',
    employerPF: 'Assumption: employer PF (clause (c)) is part of "all remuneration" for the 50% test; toggleable',
    pfRate: 'Employer PF contribution rate 12% of wages (EPF Scheme 1952)',
    gratuity: 'Gratuity = last wages x 15/26 x completed years (6+ months rounds up); cap Rs 20 lakh. Exits on or after 21 Nov 2025 use the revised wage definition (MoLE FAQ summary)',
    scope: 'Central rules only; state rules, ESI, leave encashment and actuarial discounting are out of scope'
  };
  const RULESETS = [
    Object.assign({}, BASE_RS, {
      id: 'CoW-2y-central-v1',
      label: 'Central - Code on Wages s.2(y), 50% threshold (v1)',
      citations: Object.assign({}, CITE_COMMON, { pfCeiling: 'EPF statutory wage ceiling Rs 15,000/month (in force for periods 2025-12 to 2026-02)' })
    }),
    Object.assign({}, BASE_RS, {
      id: 'CoW-2y-central-v2',
      version: 'v2',
      label: 'Central · EPF ceiling ₹25,000 (from 17 Sep 2026)',
      effectiveFrom: '2026-09-17',
      pfCeiling: 25000,
      citations: Object.assign({}, CITE_COMMON, { pfCeiling: 'EPFO wage ceiling notification, Sep 2026 (Rs 15,000 raised to Rs 25,000/month, effective 17 Sep 2026)' })
    }),
    Object.assign({}, BASE_RS, {
      id: 'whatif-40',
      version: 'whatif',
      label: 'What-if: 40% threshold (hypothetical notification)',
      threshold: 0.4,
      hypothetical: true,
      citations: Object.assign({}, CITE_COMMON, {
        threshold: 'HYPOTHETICAL: the proviso allows the Central Government to notify a percentage other than one-half; 40% is an illustration, not a notification',
        pfCeiling: 'EPF statutory wage ceiling Rs 15,000/month'
      })
    })
  ];

  function getRuleset(id) { return RULESETS.find(function (r) { return r.id === id; }) || null; }
  function withOverrides(rs, o) {
    const out = Object.assign({}, rs, o || {});
    const keys = Object.keys(o || {});
    if (keys.length) {
      out.id = rs.id + '+' + keys.map(function (k) { return k + '=' + o[k]; }).join(',');
      out.label = rs.label + ' [' + keys.map(function (k) { return k + '=' + o[k]; }).join(', ') + ']';
    }
    return out;
  }

  // ---------------------------------------------------------------- resolution
  const idxCache = new WeakMap();
  function buildIndex(cc) {
    let idx = idxCache.get(cc);
    if (idx) return idx;
    idx = { bySystem: Object.create(null), byId: Object.create(null) };
    for (let i = 0; i < cc.length; i++) {
      const c = cc[i];
      idx.byId[c.id] = c;
      for (let j = 0; j < c.aliases.length; j++) {
        const a = c.aliases[j];
        const m = idx.bySystem[a.system] || (idx.bySystem[a.system] = Object.create(null));
        m[a.code] = c.id;
      }
    }
    idxCache.set(cc, idx);
    return idx;
  }
  function resolve(system, code, cc) {
    const m = buildIndex(cc).bySystem[system];
    if (!m) return null;
    const v = m[code];
    return v === undefined ? null : v;
  }

  function makeGlossary(cc, source) {
    const g = {};
    for (let i = 0; i < cc.length; i++) {
      const c = cc[i];
      if (source === 'gold') {
        g[c.id] = { category: c.gold.category, status: 'approved', confidence: 1, reviewer: 'gold-label', reason: c.gold.note || null };
      } else {
        g[c.id] = { category: c.proposed.category, status: 'proposed', confidence: c.proposed.confidence, reviewer: null, reason: null };
      }
    }
    return g;
  }

  // ---------------------------------------------------------------- compute
  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  function computeMonth(lines, glossary, rs, cc, opts) {
    opts = opts || {};
    const wantTrace = opts.trace !== false;
    const wantDetail = wantTrace || opts.detail === true;
    const idx = buildIndex(cc);
    let core = 0, other = 0, capped = 0, outside = 0, terminal = 0, erPFDropped = 0;
    const unresolved = [];
    const unrevSet = Object.create(null);
    const comps = wantDetail ? new Map() : null;

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const sm = idx.bySystem[ln.system];
      const cid = sm ? sm[ln.code] : undefined;
      if (cid === undefined) { unresolved.push({ system: ln.system, code: ln.code, amount: ln.amount, reason: 'unknown code: no canonical component' }); continue; }
      const g = glossary[cid];
      if (!g) { unresolved.push({ system: ln.system, code: ln.code, amount: ln.amount, canonicalId: cid, reason: 'no glossary entry for ' + cid }); continue; }
      const info = CATEGORIES[g.category];
      if (!info) { unresolved.push({ system: ln.system, code: ln.code, amount: ln.amount, canonicalId: cid, reason: 'invalid category ' + g.category }); continue; }
      const amt = ln.amount;
      if (g.status === 'proposed') unrevSet[cid] = true;
      if (g.category === 'WAGE_CORE') core += amt;
      else if (g.category === 'WAGE_OTHER') other += amt;
      else if (info.inCap) {
        if (g.category === 'EXCL_C' && !rs.includeEmployerPFInRemuneration) erPFDropped += amt;
        else capped += amt;
      } else if (g.category === 'OUTSIDE') outside += amt;
      else terminal += amt;
      if (wantDetail) {
        let c = comps.get(cid);
        if (!c) { c = { canonicalId: cid, name: idx.byId[cid].name, category: g.category, clause: info.clause, status: g.status, amount: 0, lines: [] }; comps.set(cid, c); }
        c.amount += amt;
        c.lines.push({ system: ln.system, code: ln.code, amount: amt });
      }
    }

    const baseWage = core + other;
    const R = baseWage + capped;
    const cap = rs.threshold * R;
    const addback = capped > cap ? capped - cap : 0;
    const codeWage = baseWage + addback;
    const oldPFBase = core;
    const unreviewed = Object.keys(unrevSet);
    const out = { R: R, baseWage: baseWage, capped: capped, cap: cap, addback: addback, codeWage: codeWage, oldPFBase: oldPFBase,
      core: core, other: other, outside: outside, terminalExcluded: terminal, unresolved: unresolved, unreviewed: unreviewed };

    if (wantDetail) out.components = Array.from(comps.values());
    if (wantTrace) {
      const t = [];
      out.components.forEach(function (c) {
        t.push({ step: 'classify:' + c.canonicalId,
          formula: c.lines.map(function (l) { return l.system + ' ' + l.code; }).join(' + ') + ' -> ' + c.name + ' -> ' + c.category + ' (' + c.status + ')',
          value: c.amount, cite: c.clause + (CATEGORIES[c.category].inCap ? ' [inside 50% group]' : '') });
      });
      unresolved.forEach(function (u) {
        t.push({ step: 'warning:unresolved', formula: u.system + ' ' + u.code + ' (' + u.reason + ') excluded from R', value: u.amount, cite: 'glossary: component unresolved, needs human mapping' });
      });
      if (erPFDropped) t.push({ step: 'assumption:erPF', formula: 'Employer PF ' + erPFDropped + ' dropped from remuneration (includeEmployerPFInRemuneration=false)', value: erPFDropped, cite: 'ruleset.includeEmployerPFInRemuneration' });
      t.push({ step: 'baseWage', formula: 'WAGE_CORE + WAGE_OTHER = ' + core + ' + ' + other, value: baseWage, cite: 's.2(y) main part + (i)-(iii)' });
      t.push({ step: 'capped', formula: 'sum of EXCL_A..EXCL_I' + (rs.includeEmployerPFInRemuneration ? '' : ' (EXCL_C dropped)') + ' = ' + capped, value: capped, cite: 's.2(y)(a)-(i)' });
      t.push({ step: 'R', formula: 'baseWage + capped = ' + baseWage + ' + ' + capped + ' (EXCL_J, EXCL_K, OUTSIDE not in R)', value: R, cite: 's.2(y) proviso: "all remuneration"' });
      t.push({ step: 'cap', formula: 'threshold x R = ' + rs.threshold + ' x ' + R, value: cap, cite: 'ruleset ' + rs.id + '.threshold' });
      t.push({ step: 'addback', formula: 'max(0, capped - cap) = max(0, ' + capped + ' - ' + cap + ')', value: addback, cite: 's.2(y) proviso (excess deemed remuneration)' });
      t.push({ step: 'codeWage', formula: 'baseWage + addback = ' + baseWage + ' + ' + addback, value: codeWage, cite: 's.2(y) as amended: wages for PF and gratuity' });
      t.push({ step: 'oldPFBase', formula: 'sum of WAGE_CORE = ' + oldPFBase, value: oldPFBase, cite: 'pre-Code practice: PF on basic + DA' });
      out.trace = t;
    }
    return out;
  }

  function serviceMonthsBetween(doj, asOf) {
    const a = doj.split('-'), b = asOf.split('-');
    let m = (+b[0] - +a[0]) * 12 + (+b[1] - +a[1]);
    if (+b[2] < +a[2]) m -= 1;
    return Math.max(0, m);
  }
  function yearsFromMonths(m) { return Math.floor(m / 12) + (m % 12 >= 6 ? 1 : 0); }

  function computeEmployee(emp, glossary, rs, cc, asOf, opts) {
    asOf = asOf || '2026-02-28';
    opts = opts || {};
    const wantTrace = opts.trace !== false;
    const mopts = wantTrace ? { trace: true } : { trace: false, detail: !!opts.detail };
    const months = [];
    for (let i = 0; i < emp.months.length; i++) {
      const r = computeMonth(emp.months[i].lines, glossary, rs, cc, mopts);
      r.period = emp.months[i].period;
      months.push(r);
    }
    const latest = months[months.length - 1];
    const f = emp.pfPolicy === 'capped' ? function (x) { return x < rs.pfCeiling ? x : rs.pfCeiling; } : function (x) { return x; };
    const pfOld = rs.pfRate * f(latest.oldPFBase);
    const pfNew = rs.pfRate * f(latest.codeWage);
    const pfDelta = pfNew - pfOld;
    const sm = serviceMonthsBetween(emp.doj, asOf);
    const serviceYears = yearsFromMonths(sm);
    const factor = rs.gratuityDays / rs.gratuityDivisor;
    const gratuityNew = Math.min(rs.gratuityCap, latest.codeWage * factor * serviceYears);
    const gratuityOld = Math.min(rs.gratuityCap, latest.oldPFBase * factor * serviceYears);
    const gratuityDelta = gratuityNew - gratuityOld;
    const eligible = serviceYears >= 5 || (!!emp.fixedTerm && serviceYears >= 1);
    const res = { months: months, latest: latest, pfOld: pfOld, pfNew: pfNew, pfDelta: pfDelta, serviceMonths: sm, serviceYears: serviceYears,
      gratuityOld: gratuityOld, gratuityNew: gratuityNew, gratuityDelta: gratuityDelta, eligible: eligible, asOf: asOf };
    if (wantTrace) {
      const t = latest.trace.slice();
      t.push({ step: 'pfOld', formula: rs.pfRate + ' x ' + (emp.pfPolicy === 'capped' ? 'min(' + latest.oldPFBase + ', ' + rs.pfCeiling + ')' : latest.oldPFBase + ' (actual-wage PF policy)'), value: pfOld, cite: 'EPF: ' + rs.pfRate * 100 + '% employer share, ceiling ' + rs.pfCeiling + ' (' + emp.pfPolicy + ')' });
      t.push({ step: 'pfNew', formula: rs.pfRate + ' x ' + (emp.pfPolicy === 'capped' ? 'min(' + latest.codeWage + ', ' + rs.pfCeiling + ')' : latest.codeWage + ' (actual-wage PF policy)'), value: pfNew, cite: 'EPF on Code wages, ruleset ' + rs.id });
      t.push({ step: 'pfDelta', formula: 'pfNew - pfOld', value: pfDelta, cite: 'monthly employer PF impact' });
      t.push({ step: 'serviceYears', formula: sm + ' months from ' + emp.doj + ' to ' + asOf + ' -> ' + Math.floor(sm / 12) + ' yrs' + (sm % 12 >= 6 ? ' + 1 (6+ months rounds up)' : ''), value: serviceYears, cite: 'gratuity: completed years, 6+ months rounds up' });
      t.push({ step: 'gratuityOld', formula: 'min(' + rs.gratuityCap + ', ' + latest.oldPFBase + ' x ' + rs.gratuityDays + '/' + rs.gratuityDivisor + ' x ' + serviceYears + ')', value: gratuityOld, cite: 'old basis (basic + DA)' });
      t.push({ step: 'gratuityNew', formula: 'min(' + rs.gratuityCap + ', ' + latest.codeWage + ' x ' + rs.gratuityDays + '/' + rs.gratuityDivisor + ' x ' + serviceYears + ')', value: gratuityNew, cite: 'revised wage definition, ruleset ' + rs.id });
      t.push({ step: 'gratuityDelta', formula: 'gratuityNew - gratuityOld (eligible: ' + eligible + ')', value: gratuityDelta, cite: 'liability estimate, undiscounted' });
      res.trace = t;
    }
    return res;
  }

  function bump(map, key, row) {
    let o = map[key];
    if (!o) o = map[key] = { employees: 0, withAddback: 0, monthlyPFDelta: 0, gratuityDelta: 0, addbackTotal: 0 };
    o.employees++;
    if (row.addback > 0) o.withAddback++;
    o.monthlyPFDelta += row.pfDelta;
    o.gratuityDelta += row.gratuityDelta;
    o.addbackTotal += row.addback;
  }

  function runPortfolio(employees, glossary, rs, cc, opts) {
    opts = opts || {};
    const asOf = opts.asOf || '2026-02-28';
    const t0 = now();
    const perEmployee = new Array(employees.length);
    const byEntity = {}, byDept = {};
    let rows = 0, withAddback = 0, mPF = 0, gDelta = 0, gDeltaElig = 0, pfOldTot = 0, pfNewTot = 0, gNewTot = 0, gOldTot = 0, empMonths = 0, unresolvedTotal = 0;
    const unrev = Object.create(null);
    for (let i = 0; i < employees.length; i++) {
      const e = employees[i];
      const r = computeEmployee(e, glossary, rs, cc, asOf, { trace: false });
      for (let k = 0; k < e.months.length; k++) {
        rows += e.months[k].lines.length; empMonths++;
        const mm = r.months[k];
        if (mm.unresolved.length) unresolvedTotal += mm.unresolved.length;
        for (let u = 0; u < mm.unreviewed.length; u++) unrev[mm.unreviewed[u]] = true;
      }
      const L = r.latest;
      const row = { idx: i, id: e.id, name: e.name, entity: e.entity, system: e.system, dept: e.dept, grade: e.grade, doj: e.doj, pfPolicy: e.pfPolicy,
        serviceYears: r.serviceYears, eligible: r.eligible, R: L.R, baseWage: L.baseWage, capped: L.capped, addback: L.addback, codeWage: L.codeWage, oldPFBase: L.oldPFBase,
        pfOld: r.pfOld, pfNew: r.pfNew, pfDelta: r.pfDelta, gratuityOld: r.gratuityOld, gratuityNew: r.gratuityNew, gratuityDelta: r.gratuityDelta,
        impact: 12 * r.pfDelta + r.gratuityDelta, emp: e };
      perEmployee[i] = row;
      if (L.addback > 0) withAddback++;
      mPF += r.pfDelta; pfOldTot += r.pfOld; pfNewTot += r.pfNew;
      gDelta += r.gratuityDelta; gNewTot += r.gratuityNew; gOldTot += r.gratuityOld;
      if (r.eligible) gDeltaElig += r.gratuityDelta;
      bump(byEntity, e.entity, row); bump(byDept, e.dept, row);
    }
    const topImpacted = perEmployee.slice().sort(function (a, b) { return b.impact - a.impact; }).slice(0, 25);
    const run = {
      rowsProcessed: rows, employeeMonths: empMonths, employees: employees.length, withAddback: withAddback,
      pctWithAddback: employees.length ? 100 * withAddback / employees.length : 0,
      monthlyPFDelta: mPF, annualPFDelta: mPF * 12, monthlyPFOld: pfOldTot, monthlyPFNew: pfNewTot,
      gratuityLiabilityDelta: gDelta, gratuityLiabilityDeltaEligible: gDeltaElig, gratuityLiabilityOld: gOldTot, gratuityLiabilityNew: gNewTot,
      byEntity: byEntity, byDept: byDept, topImpacted: topImpacted, perEmployee: perEmployee,
      unresolvedLines: unresolvedTotal, unreviewedComponents: Object.keys(unrev), draft: Object.keys(unrev).length > 0,
      ruleset: rs.id, rulesetLabel: rs.label, asOf: asOf, ms: now() - t0
    };
    Object.defineProperty(run, '_ctx', { value: { employees: employees, glossary: glossary, ruleset: rs, cc: cc }, enumerable: false });
    return run;
  }

  function diffRuns(a, b) {
    const mapA = new Map();
    for (let i = 0; i < a.perEmployee.length; i++) mapA.set(a.perEmployee[i].id, a.perEmployee[i]);
    const rows = [];
    let changed = 0, dG = 0, dPF = 0;
    for (let i = 0; i < b.perEmployee.length; i++) {
      const rb = b.perEmployee[i], ra = mapA.get(rb.id);
      if (!ra) continue;
      const dW = rb.codeWage - ra.codeWage, dp = rb.pfNew - ra.pfNew, dg = rb.gratuityNew - ra.gratuityNew;
      dG += dg; dPF += dp;
      if (Math.abs(dW) > 0.005 || Math.abs(dp) > 0.005 || Math.abs(dg) > 0.005) {
        changed++;
        rows.push({ id: rb.id, name: rb.name, entity: rb.entity, dept: rb.dept, codeWageA: ra.codeWage, codeWageB: rb.codeWage, deltaCodeWage: dW, deltaPF: dp, deltaGratuity: dg, addbackA: ra.addback, addbackB: rb.addback });
      }
    }
    rows.sort(function (x, y) { return Math.abs(y.deltaGratuity) + 12 * Math.abs(y.deltaPF) - Math.abs(x.deltaGratuity) - 12 * Math.abs(x.deltaPF); });
    return { changedEmployees: changed, deltaGratuity: dG, deltaPF: dPF, deltaAnnualPF: dPF * 12, rulesetA: a.ruleset, rulesetB: b.ruleset, rows: rows.slice(0, 200), totalRows: rows.length };
  }

  // ---------------------------------------------------------------- guardrails
  function getDocs(documents) {
    if (documents) return documents;
    const d = root.WL_DATA;
    return d ? d.documents : [];
  }
  function verifyQuote(documents, docId, quote) {
    if (typeof quote !== 'string' || quote.length === 0) return false;
    const docs = getDocs(documents);
    for (let i = 0; i < docs.length; i++) if (docs[i].id === docId) return docs[i].text.indexOf(quote) !== -1;
    return false;
  }
  function validateProposal(p, documents) {
    const errors = [];
    if (!p || typeof p !== 'object') return { ok: false, errors: ['proposal is not an object'] };
    if (!Object.prototype.hasOwnProperty.call(CATEGORIES, p.category)) errors.push('category "' + p.category + '" is not in the closed set (' + CATEGORY_IDS.join(', ') + ')');
    if (typeof p.confidence !== 'number' || isNaN(p.confidence) || p.confidence < 0 || p.confidence > 1) errors.push('confidence must be a number in [0,1]');
    if (typeof p.rationale !== 'string' || !p.rationale.length) errors.push('rationale missing');
    if (!Array.isArray(p.evidence) || p.evidence.length < 1) errors.push('at least one evidence quote is required');
    else p.evidence.forEach(function (ev, i) {
      if (!ev || !ev.docId || !ev.quote) errors.push('evidence[' + i + '] needs docId and quote');
      else if (!verifyQuote(documents, ev.docId, ev.quote)) errors.push('evidence[' + i + '] quote not found verbatim in ' + ev.docId);
    });
    return { ok: errors.length === 0, errors: errors };
  }

  function evalClassifier(cc, glossaryOrProposals) {
    let total = 0, correct = 0;
    const conf = {}, misses = [];
    for (let i = 0; i < cc.length; i++) {
      const c = cc[i];
      let pred;
      if (glossaryOrProposals && glossaryOrProposals[c.id]) pred = glossaryOrProposals[c.id].category;
      else pred = c.proposed.category;
      const gold = c.gold.category;
      total++;
      const key = gold + '>' + pred;
      conf[key] = (conf[key] || 0) + 1;
      if (pred === gold) correct++;
      else misses.push({ id: c.id, name: c.name, gold: gold, predicted: pred, confidence: c.proposed.confidence, rationale: c.proposed.rationale, note: c.gold.note });
    }
    const confusion = Object.keys(conf).map(function (k) { const p = k.split('>'); return { gold: p[0], predicted: p[1], count: conf[k] }; });
    return { total: total, correct: correct, accuracy: total ? correct / total : 0, confusion: confusion, misses: misses };
  }

  // ---------------------------------------------------------------- tests
  function approx(a, b) { return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 0.01; }
  function eq(a, b) { return (typeof a === 'number' && typeof b === 'number') ? approx(a, b) : JSON.stringify(a) === JSON.stringify(b); }

  function monthActual(tc, variant, cc) {
    const baseRs = getRuleset(variant.rulesetId || tc.rulesetId || 'CoW-2y-central-v1');
    const rs = variant.overrides ? withOverrides(baseRs, variant.overrides) : baseRs;
    const idx = buildIndex(cc);
    const gl = {}, lines = [];
    tc.lines.forEach(function (l) {
      const c = idx.byId[l.component];
      if (!c) throw new Error('unknown component ' + l.component);
      gl[l.component] = { category: l.category, status: 'approved', confidence: 1, reviewer: 'test', reason: null };
      lines.push({ system: c.aliases[0].system, code: c.aliases[0].code, amount: l.amount });
    });
    const emp = Object.assign({ id: 'TEST', pfPolicy: 'capped', doj: '2015-01-01', fixedTerm: false }, tc.employee || {}, { months: [{ period: '2026-02', lines: lines }] });
    const r = computeEmployee(emp, gl, rs, cc, tc.asOf || '2026-02-28');
    const L = r.latest;
    return { R: L.R, baseWage: L.baseWage, capped: L.capped, cap: L.cap, addback: L.addback, codeWage: L.codeWage, oldPFBase: L.oldPFBase,
      pfOld: r.pfOld, pfNew: r.pfNew, serviceYears: r.serviceYears, gratuityNew: r.gratuityNew, gratuityOld: r.gratuityOld };
  }

  function compareObjs(exp, act) {
    const bad = [];
    Object.keys(exp).forEach(function (k) { if (!eq(exp[k], act[k])) bad.push(k + ': expected ' + JSON.stringify(exp[k]) + ' got ' + JSON.stringify(act[k])); });
    return bad;
  }

  function runTests(testCases, cc, documents) {
    const data = root.WL_DATA || {};
    cc = cc || data.canonicalComponents;
    documents = documents || data.documents;
    return testCases.map(function (tc) {
      try {
        if (tc.kind === 'resolve') {
          const actual = {};
          tc.pairs.forEach(function (p) { actual[p.system + ':' + p.code] = resolve(p.system, p.code, cc); });
          const exp = {}; tc.pairs.forEach(function (p) { exp[p.system + ':' + p.code] = p.expect; });
          // unresolved codes must be excluded from R and reported
          const g = makeGlossary(cc, 'gold');
          const m = computeMonth([{ system: 'SAPHR', code: '1001', amount: 1000 }, { system: 'SAPHR', code: 'ZZ99', amount: 5000 }], g, RULESETS[0], cc);
          actual['ZZ99 excluded from R and flagged'] = m.R === 1000 && m.unresolved.length === 1 && m.unresolved[0].code === 'ZZ99' && m.trace.some(function (s) { return s.step === 'warning:unresolved'; });
          exp['ZZ99 excluded from R and flagged'] = true;
          const bad = compareObjs(exp, actual);
          return { id: tc.id, name: tc.name, kind: tc.kind, expected: exp, actual: actual, pass: bad.length === 0, note: bad.length ? bad.join('; ') : tc.proves, proves: tc.proves };
        }
        if (tc.kind === 'eval') {
          const ev = evalClassifier(cc);
          const allValid = cc.every(function (c) { return validateProposal(c.proposed, documents).ok; });
          const actual = { accuracy: ev.accuracy, correct: ev.correct, total: ev.total, misses: ev.misses.map(function (m) { return m.id; }).sort(), allProposalsValid: allValid };
          const exp = tc.expected;
          const bad = compareObjs({ accuracy: exp.accuracy, misses: exp.misses, allProposalsValid: true }, actual);
          const note = 'accuracy ' + (ev.accuracy * 100).toFixed(1) + '% (' + ev.correct + '/' + ev.total + '); misses: ' + ev.misses.map(function (m) { return m.name + ' proposed ' + m.predicted + ' vs gold ' + m.gold; }).join('; ') + '. Misses are kept, not tuned away.';
          return { id: tc.id, name: tc.name, kind: tc.kind, eval: ev, expected: exp, actual: actual, pass: bad.length === 0, note: bad.length ? bad.join('; ') + ' | ' + note : note, proves: tc.proves };
        }
        // month-based
        const variants = tc.variants && tc.variants.length ? tc.variants : [{ label: '', expected: tc.expected }];
        const expAll = {}, actAll = {}, bad = [];
        const cache = {};
        variants.forEach(function (v) {
          const act = monthActual(tc, v, cc);
          cache[v.label || ''] = act;
          const pre = variants.length > 1 || v.label ? (v.label || 'v') + '.' : '';
          Object.keys(v.expected || {}).forEach(function (k) { expAll[pre + k] = v.expected[k]; actAll[pre + k] = act[k]; });
          compareObjs(v.expected || {}, act).forEach(function (b) { bad.push(pre + b); });
          if (v.expectedDelta) {
            const other = monthActual(tc, { rulesetId: v.expectedDelta.vs, overrides: v.expectedDelta.overrides }, cc);
            Object.keys(v.expectedDelta.values).forEach(function (k) {
              const d = act[k] - other[k];
              expAll[pre + 'delta.' + k] = v.expectedDelta.values[k]; actAll[pre + 'delta.' + k] = d;
              if (!approx(d, v.expectedDelta.values[k])) bad.push(pre + 'delta.' + k + ': expected ' + v.expectedDelta.values[k] + ' got ' + d);
            });
          }
        });
        return { id: tc.id, name: tc.name, kind: tc.kind || 'month', expected: expAll, actual: actAll, pass: bad.length === 0, note: bad.length ? bad.join('; ') : tc.proves, proves: tc.proves };
      } catch (e) {
        return { id: tc.id, name: tc.name, kind: tc.kind, expected: tc.expected || null, actual: null, pass: false, note: 'exception: ' + e.message, proves: tc.proves };
      }
    });
  }

  // ---------------------------------------------------------------- audit CSV
  function csvCell(v) {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  function toAuditCSV(run, opts) {
    opts = opts || {};
    const ctx = run._ctx;
    if (!ctx) throw new Error('run has no context; produce it with runPortfolio');
    const idx = buildIndex(ctx.cc);
    const rs = ctx.ruleset, gl = ctx.glossary;
    const out = ['employee,period,component,category,clause,amount,R,cap,addback,codeWage,ruleset,source,glossary_status'];
    const limit = opts.maxEmployees || ctx.employees.length;
    for (let i = 0; i < limit && i < ctx.employees.length; i++) {
      const e = ctx.employees[i];
      for (let k = 0; k < e.months.length; k++) {
        const mo = e.months[k];
        const m = computeMonth(mo.lines, gl, rs, ctx.cc, { trace: false });
        for (let j = 0; j < mo.lines.length; j++) {
          const ln = mo.lines[j];
          const sm = idx.bySystem[ln.system];
          const cid = sm ? sm[ln.code] : undefined;
          let name = 'UNRESOLVED', cat = 'UNRESOLVED', clause = '', st = '';
          if (cid !== undefined && gl[cid] && CATEGORIES[gl[cid].category]) { name = idx.byId[cid].name; cat = gl[cid].category; clause = CATEGORIES[cat].clause; st = gl[cid].status; }
          out.push([e.id, mo.period, name, cat, clause, r2(ln.amount), r2(m.R), r2(m.cap), r2(m.addback), r2(m.codeWage), rs.id, ln.system + ':' + ln.code, st].map(csvCell).join(','));
        }
      }
    }
    return out.join('\n') + '\n';
  }

  // ---------------------------------------------------------------- formatting helpers (Indian grouping)
  function fmtINR(n, dec) {
    const neg = n < 0; n = Math.abs(n);
    const s = n.toFixed(dec || 0);
    const p = s.split('.');
    let i = p[0], last3 = i.slice(-3), rest = i.slice(0, -3);
    if (rest) last3 = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    return (neg ? '-' : '') + '₹' + last3 + (p[1] ? '.' + p[1] : '');
  }
  function fmtCrLakh(n) {
    const a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' cr';
    if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + ' lakh';
    return fmtINR(n);
  }

  const WL_ENGINE = {
    CATEGORIES: CATEGORIES, CATEGORY_IDS: CATEGORY_IDS, RULESETS: RULESETS, getRuleset: getRuleset, withOverrides: withOverrides,
    makeGlossary: makeGlossary, resolve: resolve, computeMonth: computeMonth, computeEmployee: computeEmployee,
    runPortfolio: runPortfolio, diffRuns: diffRuns, verifyQuote: verifyQuote, validateProposal: validateProposal,
    evalClassifier: evalClassifier, runTests: runTests, toAuditCSV: toAuditCSV, fmtINR: fmtINR, fmtCrLakh: fmtCrLakh,
    serviceMonthsBetween: serviceMonthsBetween, yearsFromMonths: yearsFromMonths
  };
  root.WL_ENGINE = WL_ENGINE;
  if (typeof module !== 'undefined' && module.exports) module.exports = WL_ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
