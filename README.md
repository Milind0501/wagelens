# WageLens

**Labour Code wage audit for multi-system payroll.**

**The problem.** India's Labour Codes (in force 21 Nov 2025) redefine "wages" in the Code on Wages 2019, s.2(y): exclusions in clauses (a) to (i) above 50% of total remuneration are added back, which raises the base for PF and gratuity (TCS, Infosys and HCLTech booked one-time charges in Q3 FY26).
**The hard part is not the arithmetic.** It is deciding, for every pay component across several legacy payroll systems with custom names and flexi baskets, which clause it falls under, with evidence an auditor can check.
**WageLens** uses AI only on component metadata to propose that classification with verified quotes, has a human approve it once, and then computes every employee-month deterministically with a line-by-line trace.

> All employees, companies and documents in this repository are synthetic. Northwind Analytics is fictional. The Tresata CTC breakup test (T01, T02) uses the figures published in Tresata's IIT Delhi job notification. Statute text (s.2(y)) is reproduced verbatim; the case note and MoLE FAQ entries are labelled summaries, not official text.

## How to run

- **Live demo (GitHub Pages):** `https://milind0501.github.io/wagelens/` — static site, nothing to install. Five screens: Connect estate → Agent run → Review glossary → Results → Rules & tests.
- **Locally:** clone and run `python3 -m http.server` in the repo folder, then open `http://localhost:8000` (or just open `index.html`).
- **Live AI:** on the *Agent run* screen, "Classify a new pay component live" sends one component's name and description plus the six source documents (no employee rows) to an LLM, then runs the same guardrails (closed category set, every quote must be an exact substring of its source). Providers: **OpenRouter** with your own key (default model `meta-llama/llama-3.3-70b-instruct:free`; the key stays in the tab's memory only), or **Claude** when the page is opened as a claude.ai artifact. Without a key it shows the recorded run.
- **Brief:** `docs/WageLens_brief.pdf` (problem, architecture, risks, results, appendix).
- **Tests:** `node tests/run_tests.mjs` (Node 18+). Prints a table, writes `tests/test_report.json`, exits 1 if any deterministic test fails.

Files: `data.js` (synthetic estate, source documents, recorded agent run, seeded generator, test cases), `engine.js` (rules and computation), `prompts/classify.md` (production classification prompt), `tests/`.

## Screens

| Agent run | Review glossary |
|---|---|
| ![Agent run](docs/screens/agent.png) | ![Review glossary](docs/screens/glossary.png) |
| **Results** | **Rules & tests** |
| ![Results](docs/screens/results.png) | ![Rules](docs/screens/rules.png) |

## Architecture

- **AI on metadata, never rows.** The agent reads pay-component dictionaries (name, code, description, counts) and retrieved documents. It makes hundreds of calls, not millions, and no employee data leaves the payroll estate.
- **Deterministic engine on rows.** `engine.js` computes base wage, the capped exclusion group, the 50% add-back, Code wage, employer PF and gratuity for each employee-month. 10,000 employees x 3 months (about 180,000 payroll lines) run in well under a second in a browser. Every step carries a formula and a clause citation.
- **Human-approved glossary.** The model's output is a proposal. Approve, or override with a required reason. Runs on unapproved proposals are labelled DRAFT and list the unreviewed components.
- **Versioned rule store.** Thresholds, the employer-PF assumption, PF ceiling and gratuity parameters live in rulesets, not in code: `CoW-2y-central-v1` (50%, PF ceiling Rs 15,000, in force for 2025-12 to 2026-02), `CoW-2y-central-v2` (EPF wage ceiling Rs 25,000 from 17 Sep 2026, per the EPFO notification, the real example of knowledge going stale: same inputs, one version swap, PF changes) and `whatif-40` (hypothetical 40% notification). Switching a version re-runs the engine and `diffRuns` shows who changed.
- **Quote verification.** Every piece of evidence is checked as an exact substring of the cited document (`verifyQuote`); proposals with an invalid category, missing evidence or an unverifiable quote are rejected and retried (`validateProposal`).
- **Lineage CSV.** `toAuditCSV` exports employee, period, component, category, clause, amount, R, cap, add-back, Code wage and ruleset for each payroll line, plus the raw source code and glossary status, for the statutory auditor.

## Examples tested

Run `node tests/run_tests.mjs`. Result column is from the latest `tests/test_report.json`. Expected values are hand-computed literals in `data.js`; none are generated from engine output.

| ID | What it proves | Result |
|---|---|---|
| T01 | Tresata's own CTC breakup with Flexible Allowance as wages: R 146,394, add-back 0, Code wage 105,894 | PASS |
| T02 | Same CTC with Flexible fully declared as conveyance/LTA: 71,394 vs cap 73,197, so no add-back, Code wage 75,000 (a declaration moves the answer by 30,894) | PASS |
| T03 | Classic 30% basic structure: add-back 20,000, Code wage 50,000 | PASS |
| T04 | Special Allowance as WAGE_OTHER removes the add-back; old PF base stays basic only | PASS |
| T05 | Overtime spike month triggers an add-back (7,500) | PASS |
| T06 | Commission-heavy month: add-back 25,000 | PASS |
| T07 | PF ceiling crossed (capped policy): employer PF 1,440 to 1,800 | PASS |
| T08 | Employer-PF-in-remuneration assumption flips add-back from 900 to 0 | PASS |
| T09 | Statutory bonus month: add-back 1,250 | PASS |
| T10 | Exit month: gratuity payout (EXCL_J) stays outside R; 7y 8m rounds to 8 years; liability 230,769.23 to 346,153.85 | PASS |
| T11 | Reimbursement against bills (OUTSIDE) is not in R; Code wage 30,000 (misclassified it would be 38,000) | PASS |
| T12 | SAPHR `1020` and GREYCSV `SPECIAL_ALLOW` resolve to one component; OT and Night Shift stay separate; unknown code `ZZ99` returns null and is excluded from R with a warning | PASS |
| T13 | 40% what-if on T03 inputs: cap 40,000, add-back 30,000, Code wage 60,000 (+10,000 vs v1) | PASS |
| T14 | Classifier eval vs human gold labels: 90.0% (18/20), 2 deliberate misses reported, all 41 quotes verified | PASS (eval) |
| T15 | EPF ceiling change (v2): T07 inputs, employer PF 1,440 to 1,980 under the Rs 25,000 ceiling | PASS |

Extra checks in the same run: all quotes verbatim, the recorded failed quote really fails, generator deterministic per seed with no `Math.random`, zero unresolved lines on the generated estate, and 10,000 employees x 3 months processed in under one second.

## Failures and limitations (honest)

- **The classifier missed 2 of 20 (90.0%).** *Night Shift Allowance* was proposed EXCL_E (special expenses of the job, confidence 0.62); the human label is WAGE_OTHER because it is contractual monthly pay, not reimbursement of an expense. *Retention Bonus (monthly, contractual)* was proposed EXCL_A (confidence 0.60); the human label is WAGE_OTHER because clause (a) only covers a bonus payable under a law that is not part of contract remuneration, and the offer letter says this bonus is part of monthly remuneration. Both were low-confidence and went to the human queue. The misses are kept in the eval, not tuned away. With 20 components this is a demonstration, not a benchmark.
- **The Flexible basket needs per-employee FBP declarations.** The component carries one label, but the FBP rules make its character depend on each employee's declaration. The glossary uses the no-declaration default (WAGE_OTHER) and flags it for review; T01 vs T02 shows the size of the swing. A production version needs the declaration file as a second input.
- **State rules are not modelled.** Central rules only. Also out of scope: leave encashment, actuarial discounting, ESI, bonus eligibility, and running payroll.
- **Employer PF inside "all remuneration" is an assumption**, not settled law. It is a ruleset switch (T08 shows it can flip the answer).
- **Monthly vs annual computation is a choice.** The engine tests the 50% threshold per employee-month and reports PF and gratuity from the latest month. An annual basis smooths spikes (overtime, bonus months) and could give a different answer.
- **Reimbursements (OUTSIDE) are judgement**, not statute, and are always routed to a human.
- **The 40% what-if is hypothetical**, not a notification. The v2 ruleset (EPF ceiling Rs 25,000) is taken from the EPFO notification as reported in September 2026 and should be re-verified against the notification text before any use.
- **Synthetic data only.** Gratuity liability is an undiscounted estimate for all employees (eligibility shown separately), not an Ind AS 19 actuarial valuation. Nothing here is legal advice; a labour-law CA signs the glossary.

## Models used

- **Recorded agent run and the 20 recorded proposals** were authored during the build with Claude (Anthropic, Claude Opus 5.5) and are illustrative, not a live trace.
- **Live classification:** any OpenRouter model via your key (tested default: `meta-llama/llama-3.3-70b-instruct:free`, a free-tier model with rate limits), or Claude via the claude.ai artifact runtime. Same prompt for both (`prompts/classify.md`); the design is model-agnostic because every answer is validated by deterministic code before a human sees it.
- **Built with:** Claude Opus 5.5 / Sonnet 5.5 coding agents in parallel against a fixed interface contract and hand-computed test expectations (see the LLM logs in the submission).
