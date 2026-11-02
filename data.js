/* WageLens synthetic data + seeded generator. Plain browser JS; also loads in Node.
 * ALL employees, companies and company documents are synthetic. LAW_2Y is the statute text (Code on Wages 2019, s.2(y)).
 * Exposes window.WL_DATA (globalThis.WL_DATA in Node). Recorded agent run and proposals were authored during the build with Claude (Anthropic) and are illustrative.
 */
(function (root) {
"use strict";
// ---- documents (synthetic company docs; statute text verbatim) ----
const LAW_2Y_TEXT = `"wages" means all remuneration whether by way of salaries, allowances or otherwise, expressed in terms of money or capable of being so expressed which would, if the terms of employment, express or implied, were fulfilled, be payable to a person employed in respect of his employment or of work done in such employment, and includes,— (i) basic pay; (ii) dearness allowance; and (iii) retaining allowance, if any, but does not include— (a) any bonus payable under any law for the time being in force, which does not form part of the remuneration payable under the terms of employment; (b) the value of any house-accommodation, or of the supply of light, water, medical attendance or other amenity or of any service excluded from the computation of wages by a general or special order of the appropriate Government; (c) any contribution paid by the employer to any pension or provident fund, and the interest which may have accrued thereon; (d) any conveyance allowance or the value of any travelling concession; (e) any sum paid to the employed person to defray special expenses entailed on him by the nature of his employment; (f) any house rent allowance; (g) remuneration payable under any award or settlement between the parties or order of a court or Tribunal; (h) any overtime allowance; (i) any commission payable to the employee; (j) any gratuity payable on the termination of employment; (k) any retrenchment compensation or other retirement benefit payable to the employee or any ex gratia payment made to him on the termination of employment: Provided that, for calculating the wages under this clause, if payments made by the employer to the employee under clauses (a) to (i) exceeds one-half, or such other per cent. as may be notified by the Central Government, of the all remuneration calculated under this clause, the amount which exceeds such one-half, or the per cent. so notified, shall be deemed as remuneration and shall be accordingly added in wages under this clause.`;

const POLICY_COMP_TEXT = `Northwind Analytics Pvt Ltd - Compensation Policy 2025 [SYNTHETIC DOCUMENT - fictional company, created for the WageLens prototype]. Applies to Northwind Bengaluru and Northwind Pune.

1. Fixed pay. Basic Salary is 40% of monthly fixed pay for grades L3 and above and 30% for grades L1 and L2. House Rent Allowance is paid at 50% of Basic Salary in Bengaluru and 40% in Pune. Dearness Allowance is paid only to employees on legacy contracts and is a fixed percentage of Basic Salary.
2. Special Allowance is a fixed monthly amount payable to every employee in the grade as part of contractual fixed pay and is not linked to any condition or performance.
3. Conveyance Allowance and Leave Travel Allowance are paid monthly with salary as a fixed sum towards commuting and travel.
4. Shift and overtime. Night Shift Allowance is paid per night worked to employees rostered between 10 pm and 6 am. Overtime is paid at twice the ordinary rate for hours worked beyond the scheduled shift.
5. Variable pay. Sales Incentive is paid monthly as commission on achieved targets. Retention Bonus is a contractual monthly amount of 10% of Basic Salary payable for 24 months under the individual retention agreement.
6. Statutory. Bonus under the Payment of Bonus Act, 1965 is paid once a year to eligible employees whose salary does not exceed Rs 21,000 per month. Employer contribution to the Provident Fund is 12% of Basic Salary, capped at Rs 15,000 of wages for employees on the capped PF policy.
7. Other. Uniform Allowance is paid to operations staff to defray the cost of the mandatory uniform and its upkeep. Senior grades may be provided company lease accommodation; the company leases the premises and the value is taxed as a perquisite. Fuel and telephone costs are reimbursed only against bills, up to entitlement; nothing is paid without a bill.
8. Separation. Gratuity is paid under the Payment of Gratuity Act on separation. Notice pay in lieu may be paid ex gratia at management discretion. Amounts under any long-term settlement are paid as set out in that settlement.`;

const POLICY_FBP_TEXT = `Northwind Flexible Benefit Plan (FBP) Rules [SYNTHETIC DOCUMENT - fictional company, created for the WageLens prototype].

1. Eligibility. Employees in grades L5 and above receive a monthly Flexible Allowance as part of fixed pay.
2. Declaration. Each year, before 30 April, the employee may declare how the Flexible Allowance is to be used from the following baskets: Leave Travel Allowance, Conveyance, Meal Vouchers, Books and Periodicals, and Telephone and Internet.
3. Treatment. Amounts declared against a basket are paid monthly and carry the character of that basket. Declared Leave Travel and Conveyance amounts are paid as fixed travel allowances; declarations for meal, books and telephone baskets are reimbursed only against bills.
4. Default. Any part of the Flexible Allowance not declared by the employee is paid out in cash along with monthly salary.
5. Changes. A declaration cannot be changed during the financial year except on a qualifying life event.
6. Consequence for classification. The statutory character of the Flexible Allowance therefore differs from employee to employee and is determined by that employee's declaration on record, not by the name of the allowance.`;

const OFFER_TPL_TEXT = `Northwind Analytics - Offer Letter, Annexure A (CTC breakup) template [SYNTHETIC DOCUMENT - fictional company, created for the WageLens prototype].

Annexure A lists the following monthly components payable to the employee under the terms of this letter.
A. Fixed monthly pay: Basic Salary; House Rent Allowance; Special Allowance; Flexible Allowance (grades L5 and above, per the Flexible Benefit Plan); Leave Travel Allowance; Conveyance Allowance.
B. Employer contributions: Employer's contribution to the Provident Fund, and Gratuity accrual (not paid monthly).
C. Shift-based pay for operations roles: Night Shift Allowance, paid per night worked, forms part of the monthly earnings stated in this Annexure.
D. Variable pay: Sales Incentive (commission) for sales roles. Retention Bonus, where applicable, is a monthly amount stated in the individual retention agreement and forms part of the monthly remuneration payable under the terms of this letter.
E. Reimbursements: Fuel and Telephone reimbursements are not part of CTC and are paid only against bills.
F. Statutory payments such as bonus under the Payment of Bonus Act, 1965 are paid under that Act and are not part of CTC.
Annual CTC is the sum of the monthly components in A to D multiplied by twelve, together with the Employer's contribution under B.`;

const SC_VVM_TEXT = `Case note [summary, not official text]. Regional Provident Fund Commissioner (II) West Bengal v. Vivekananda Vidyamandir and Others, Supreme Court of India, decided 28 February 2019.

Question. Whether special allowances, travelling allowance and similar payments must be counted as basic wages for Provident Fund contributions under the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.

Held. The Court asked whether an allowance is paid universally, necessarily and ordinarily to all employees across the board. Allowances that are paid universally, necessarily and ordinarily to all employees form part of basic wages for PF contributions. Allowances that are linked to extra work, or that are available only to those employees who avail an opportunity, are not basic wages. The label an employer gives a payment does not decide the matter; the Court looked at how the payment is actually made.

Scope. The decision concerns the EPF Act, not the Code on Wages 2019, but it is widely used as a reasoning aid for pay components whose names differ across employers.

Practical reading for classification. A fixed monthly allowance paid to everyone in a grade leans towards wages. An allowance triggered by extra work, or by a choice the employee makes, does not.`;

const MOLE_FAQ_TEXT = `MoLE Labour Codes FAQs (16 Mar 2026) - summary, not official text. Prepared for this prototype; consult the official FAQ for exact wording.

1. In force. The four Labour Codes came into force on 21 November 2025.
2. Wages. Under the Code on Wages 2019, wages include basic pay, dearness allowance and retaining allowance. The exclusions listed in clauses (a) to (i) of section 2(y) are capped, in total, at 50 per cent of total remuneration; any excess is added back to wages.
3. Outside the cap. Gratuity under clause (j) and retrenchment compensation, retirement benefits and ex gratia payments on termination under clause (k) are separate exclusions and are not part of the capped group.
4. Gratuity. Gratuity for exits on or after 21 November 2025 uses the revised wage definition.
5. Employer responsibility. Company-specific allowances have to be classified by the employer against the statutory definition on the terms of employment.`;
// ---- canonical components ----
const Q = (docId, quote) => ({ docId, quote });
const LAWQ = {
  core: Q('LAW_2Y', '(i) basic pay; (ii) dearness allowance; and (iii) retaining allowance, if any'),
  da: Q('LAW_2Y', '(ii) dearness allowance'),
  all: Q('LAW_2Y', 'all remuneration whether by way of salaries, allowances or otherwise'),
  a: Q('LAW_2Y', '(a) any bonus payable under any law for the time being in force, which does not form part of the remuneration payable under the terms of employment;'),
  b: Q('LAW_2Y', '(b) the value of any house-accommodation, or of the supply of light, water, medical attendance or other amenity'),
  c: Q('LAW_2Y', '(c) any contribution paid by the employer to any pension or provident fund, and the interest which may have accrued thereon;'),
  d: Q('LAW_2Y', '(d) any conveyance allowance or the value of any travelling concession;'),
  e: Q('LAW_2Y', '(e) any sum paid to the employed person to defray special expenses entailed on him by the nature of his employment;'),
  f: Q('LAW_2Y', '(f) any house rent allowance;'),
  g: Q('LAW_2Y', '(g) remuneration payable under any award or settlement between the parties or order of a court or Tribunal;'),
  h: Q('LAW_2Y', '(h) any overtime allowance;'),
  i: Q('LAW_2Y', '(i) any commission payable to the employee;'),
  j: Q('LAW_2Y', '(j) any gratuity payable on the termination of employment;'),
  k: Q('LAW_2Y', '(k) any retrenchment compensation or other retirement benefit payable to the employee or any ex gratia payment made to him on the termination of employment')
};

const canonicalComponents = [
  { id: 'basic', name: 'Basic Salary',
    aliases: [{ system: 'SAPHR', code: '1001' }, { system: 'GREYCSV', code: 'BASIC_SALARY' }],
    resolution: { method: 'exact label match after normalisation + amount profile (fixed, 30-50% of gross)', confidence: 0.99, needsReview: false },
    proposed: { category: 'WAGE_CORE', confidence: 0.99, needsReview: false, rationale: 'Basic pay is named in the inclusive part of s.2(y)(i). Fixed monthly amount paid to every employee.', evidence: [LAWQ.core, Q('POLICY_COMP', 'Basic Salary is 40% of monthly fixed pay for grades L3 and above')] },
    gold: { category: 'WAGE_CORE', note: 'Named in s.2(y)(i).' } },
  { id: 'da', name: 'Dearness Allowance',
    aliases: [{ system: 'SAPHR', code: '1010' }],
    resolution: { method: 'single-system component; no merge candidate', confidence: 1.0, needsReview: false },
    proposed: { category: 'WAGE_CORE', confidence: 0.98, needsReview: false, rationale: 'Dearness allowance is named in the inclusive part of s.2(y)(ii). Policy confirms it is a fixed percentage of Basic Salary for legacy contracts.', evidence: [LAWQ.da, Q('POLICY_COMP', 'Dearness Allowance is paid only to employees on legacy contracts and is a fixed percentage of Basic Salary.')] },
    gold: { category: 'WAGE_CORE', note: 'Named in s.2(y)(ii).' } },
  { id: 'special_allowance', name: 'Special Allowance',
    aliases: [{ system: 'SAPHR', code: '1020' }, { system: 'GREYCSV', code: 'SPECIAL_ALLOW' }],
    resolution: { method: 'label similarity + co-occurrence + amount profile', confidence: 0.93, needsReview: false },
    proposed: { category: 'WAGE_OTHER', confidence: 0.71, needsReview: true, rationale: 'Fixed monthly amount paid to every employee in the grade, not linked to any condition. It falls in "all remuneration ... allowances" and matches none of exclusions (a)-(k). Vivekananda Vidyamandir reasoning (universal, necessary, ordinary) points the same way. Confidence held at 0.71 because the label is generic and the balancing nature of the component means it can hide other items.', evidence: [LAWQ.all, Q('SC_VVM', 'Allowances that are paid universally, necessarily and ordinarily to all employees form part of basic wages for PF contributions.'), Q('POLICY_COMP', 'Special Allowance is a fixed monthly amount payable to every employee in the grade as part of contractual fixed pay and is not linked to any condition or performance.')] },
    gold: { category: 'WAGE_OTHER', note: 'Balancing fixed allowance; not in any exclusion. Largest swing item: counting it as wages removes most add-back.' } },
  { id: 'flexible_allowance', name: 'Flexible Allowance (FBP)',
    aliases: [{ system: 'SAPHR', code: '1030' }, { system: 'GREYCSV', code: 'Flexi Benefit Plan' }],
    resolution: { method: 'label similarity + co-occurrence (same L5+ population, same amount profile)', confidence: 0.88, needsReview: true },
    proposed: { category: 'WAGE_OTHER', confidence: 0.5, needsReview: true, rationale: 'Default treatment: undeclared balance is paid out in cash with salary, so it is wages. But the FBP rules say the character depends on each employee\'s declaration (travel baskets would be (d), bill-based baskets would sit outside remuneration). A single label per component cannot capture that; the FBP declaration per employee decides it. Needs the declaration file before the number is final.', evidence: [Q('POLICY_FBP', 'Any part of the Flexible Allowance not declared by the employee is paid out in cash along with monthly salary.'), Q('POLICY_FBP', 'is determined by that employee\'s declaration on record, not by the name of the allowance')] },
    gold: { category: 'WAGE_OTHER', note: 'Default when no FBP declaration is on file. Needs per-employee declarations to be exact; flagged for review by design.' } },
  { id: 'hra', name: 'House Rent Allowance',
    aliases: [{ system: 'SAPHR', code: '1050' }, { system: 'GREYCSV', code: 'HRA_PAID' }],
    resolution: { method: 'abbreviation expansion + amount profile (40-50% of basic)', confidence: 0.98, needsReview: false },
    proposed: { category: 'EXCL_F', confidence: 0.99, needsReview: false, rationale: 'House rent allowance is expressly excluded by s.2(y)(f). Counts in the 50% group.', evidence: [LAWQ.f, Q('POLICY_COMP', 'House Rent Allowance is paid at 50% of Basic Salary in Bengaluru and 40% in Pune.')] },
    gold: { category: 'EXCL_F', note: 'Express exclusion.' } },
  { id: 'conveyance', name: 'Conveyance Allowance',
    aliases: [{ system: 'SAPHR', code: '1070' }, { system: 'GREYCSV', code: 'Conveyance' }],
    resolution: { method: 'label similarity + amount profile', confidence: 0.96, needsReview: false },
    proposed: { category: 'EXCL_D', confidence: 0.92, needsReview: false, rationale: 'Fixed sum towards commuting; s.2(y)(d) excludes any conveyance allowance.', evidence: [LAWQ.d, Q('POLICY_COMP', 'Conveyance Allowance and Leave Travel Allowance are paid monthly with salary as a fixed sum towards commuting and travel.')] },
    gold: { category: 'EXCL_D', note: 'Express exclusion.' } },
  { id: 'lta', name: 'Leave Travel Allowance',
    aliases: [{ system: 'SAPHR', code: '1040' }, { system: 'GREYCSV', code: 'LTA Paid' }],
    resolution: { method: 'abbreviation expansion + label similarity', confidence: 0.97, needsReview: false },
    proposed: { category: 'EXCL_D', confidence: 0.85, needsReview: false, rationale: 'LTA is the value of a travelling concession, excluded under s.2(y)(d). Slightly lower confidence because here it is paid monthly as a fixed sum rather than against travel.', evidence: [LAWQ.d, Q('POLICY_COMP', 'Conveyance Allowance and Leave Travel Allowance are paid monthly with salary as a fixed sum towards commuting and travel.')] },
    gold: { category: 'EXCL_D', note: 'Travelling concession; express exclusion.' } },
  { id: 'overtime', name: 'Overtime',
    aliases: [{ system: 'SAPHR', code: '1060' }, { system: 'GREYCSV', code: 'OT Pay' }],
    resolution: { method: 'label similarity + payment basis (hours x rate)', confidence: 0.94, needsReview: false },
    proposed: { category: 'EXCL_H', confidence: 0.97, needsReview: false, rationale: 'Pay for hours beyond the scheduled shift at twice the ordinary rate is an overtime allowance under s.2(y)(h).', evidence: [LAWQ.h, Q('POLICY_COMP', 'Overtime is paid at twice the ordinary rate for hours worked beyond the scheduled shift.')] },
    gold: { category: 'EXCL_H', note: 'Express exclusion.' } },
  { id: 'sales_commission', name: 'Sales Commission',
    aliases: [{ system: 'SAPHR', code: '1080' }, { system: 'GREYCSV', code: 'Sales Comm' }],
    resolution: { method: 'label similarity + amount profile (variable, sales dept only)', confidence: 0.95, needsReview: false },
    proposed: { category: 'EXCL_I', confidence: 0.96, needsReview: false, rationale: 'Monthly incentive computed on achieved targets is commission payable to the employee, s.2(y)(i).', evidence: [LAWQ.i, Q('POLICY_COMP', 'Sales Incentive is paid monthly as commission on achieved targets.')] },
    gold: { category: 'EXCL_I', note: 'Express exclusion.' } },
  { id: 'statutory_bonus', name: 'Statutory Bonus (PoB Act)',
    aliases: [{ system: 'SAPHR', code: '1090' }, { system: 'GREYCSV', code: 'Bonus (PoB Act)' }],
    resolution: { method: 'label contains statute reference + amount profile (one month per year, low earners)', confidence: 0.95, needsReview: false },
    proposed: { category: 'EXCL_A', confidence: 0.94, needsReview: false, rationale: 'Bonus paid under the Payment of Bonus Act is a bonus payable under law and not part of contract remuneration, s.2(y)(a).', evidence: [LAWQ.a, Q('POLICY_COMP', 'Bonus under the Payment of Bonus Act, 1965 is paid once a year to eligible employees whose salary does not exceed Rs 21,000 per month.')] },
    gold: { category: 'EXCL_A', note: 'Statutory bonus; express exclusion.' } },
  { id: 'employer_pf', name: 'Employer PF Contribution',
    aliases: [{ system: 'SAPHR', code: '9001' }, { system: 'GREYCSV', code: 'PF Employer Share' }],
    resolution: { method: 'abbreviation expansion + amount profile (12% of basic)', confidence: 0.97, needsReview: false },
    proposed: { category: 'EXCL_C', confidence: 0.97, needsReview: false, rationale: 'Employer contribution to provident fund is excluded by s.2(y)(c). Whether it counts inside "all remuneration" for the 50% test is a ruleset assumption, not a classification question.', evidence: [LAWQ.c, Q('POLICY_COMP', 'Employer contribution to the Provident Fund is 12% of Basic Salary')] },
    gold: { category: 'EXCL_C', note: 'Express exclusion.' } },
  { id: 'company_lease_accommodation', name: 'Company Lease Accommodation (perquisite)',
    aliases: [{ system: 'GREYCSV', code: 'Company Lease Accom (perq)' }],
    resolution: { method: 'single-system component; no merge candidate', confidence: 1.0, needsReview: false },
    proposed: { category: 'EXCL_B', confidence: 0.88, needsReview: false, rationale: 'Value of accommodation provided by the company is the house-accommodation value excluded by s.2(y)(b). Policy says the company leases the premises and the value is taxed as a perquisite.', evidence: [LAWQ.b, Q('POLICY_COMP', 'the company leases the premises and the value is taxed as a perquisite')] },
    gold: { category: 'EXCL_B', note: 'Value of house-accommodation; express exclusion.' } },
  { id: 'uniform_allowance', name: 'Uniform Allowance',
    aliases: [{ system: 'SAPHR', code: '1150' }],
    resolution: { method: 'single-system component; no merge candidate', confidence: 1.0, needsReview: false },
    proposed: { category: 'EXCL_E', confidence: 0.8, needsReview: false, rationale: 'Paid to defray the cost of a mandatory uniform and its upkeep, a special expense entailed by the nature of the job, s.2(y)(e).', evidence: [LAWQ.e, Q('POLICY_COMP', 'Uniform Allowance is paid to operations staff to defray the cost of the mandatory uniform and its upkeep.')] },
    gold: { category: 'EXCL_E', note: 'Defrays a job-specific expense; clause (e).' } },
  { id: 'night_shift_allowance', name: 'Night Shift Allowance',
    aliases: [{ system: 'SAPHR', code: '1110' }, { system: 'GREYCSV', code: 'Night Shift Allow' }],
    resolution: { method: 'label similarity (NITE SHFT ALW vs Night Shift Allow) + amount profile (per-night rate x nights)', confidence: 0.84, needsReview: true },
    proposed: { category: 'EXCL_E', confidence: 0.62, needsReview: true, rationale: 'Paid only for nights actually worked, to compensate for the special conditions of night duty. That reads like a sum entailed by the nature of the employment, clause (e). Confidence moderate because the offer letter lists it among monthly earnings, which points the other way.', evidence: [LAWQ.e, Q('POLICY_COMP', 'Night Shift Allowance is paid per night worked to employees rostered between 10 pm and 6 am.')] },
    gold: { category: 'WAGE_OTHER', note: 'DELIBERATE MISS. Night allowance is contractual monthly remuneration (OFFER_TPL, Annexure A, C), not reimbursement of an expense; no exclusion (a)-(k) fits. Contestable under the "extra work" limb of Vivekananda Vidyamandir, but s.2(y) wages is wider than PF basic wages.' } },
  { id: 'retention_bonus', name: 'Retention Bonus (monthly, contractual)',
    aliases: [{ system: 'GREYCSV', code: 'Retention Bonus' }],
    resolution: { method: 'single-system component; no merge candidate', confidence: 1.0, needsReview: false },
    proposed: { category: 'EXCL_A', confidence: 0.6, needsReview: true, rationale: 'Labelled "bonus" and paid under a separate retention agreement, so it looks like a bonus excluded by clause (a). Confidence is moderate: clause (a) only covers a bonus payable under law that is not part of contract remuneration, and this one is contractual.', evidence: [LAWQ.a, Q('POLICY_COMP', 'Retention Bonus is a contractual monthly amount of 10% of Basic Salary payable for 24 months under the individual retention agreement.')] },
    gold: { category: 'WAGE_OTHER', note: 'DELIBERATE MISS. Clause (a) needs a bonus payable under a law AND not part of contract remuneration. OFFER_TPL says the retention bonus "forms part of the monthly remuneration payable under the terms of this letter". The label "bonus" misled the classifier.' } },
  { id: 'fuel_reimbursement', name: 'Fuel Reimbursement (against bills)',
    aliases: [{ system: 'SAPHR', code: '1130' }, { system: 'GREYCSV', code: 'Fuel Reimb (bills)' }],
    resolution: { method: 'label similarity + bill-linked description', confidence: 0.95, needsReview: false },
    proposed: { category: 'OUTSIDE', confidence: 0.6, needsReview: true, rationale: 'Reimbursement of actual expenses against bills is not remuneration at all, so it sits outside s.2(y). The statute does not say this in terms; it is a judgement that a human must confirm (clause (e) is the alternative reading).', evidence: [Q('POLICY_COMP', 'Fuel and telephone costs are reimbursed only against bills, up to entitlement; nothing is paid without a bill.'), Q('OFFER_TPL', 'Fuel and Telephone reimbursements are not part of CTC and are paid only against bills.')] },
    gold: { category: 'OUTSIDE', note: 'Reimbursement against bills; judgement call, always human-reviewed.' } },
  { id: 'telephone_reimbursement', name: 'Telephone Reimbursement (against bills)',
    aliases: [{ system: 'GREYCSV', code: 'Tel Reimb' }],
    resolution: { method: 'single-system component; no merge candidate', confidence: 1.0, needsReview: false },
    proposed: { category: 'OUTSIDE', confidence: 0.62, needsReview: true, rationale: 'Same reasoning as fuel: paid only against bills, so not remuneration. Flagged for review because the statute is silent and clause (e) is a plausible alternative.', evidence: [Q('POLICY_COMP', 'Fuel and telephone costs are reimbursed only against bills, up to entitlement; nothing is paid without a bill.'), Q('OFFER_TPL', 'Fuel and Telephone reimbursements are not part of CTC and are paid only against bills.')] },
    gold: { category: 'OUTSIDE', note: 'Reimbursement against bills; judgement call, always human-reviewed.' } },
  { id: 'gratuity_payout', name: 'Gratuity Payout (on exit)',
    aliases: [{ system: 'SAPHR', code: '9100' }, { system: 'GREYCSV', code: 'Gratuity Paid' }],
    resolution: { method: 'label similarity + amount profile (one-off, exits only)', confidence: 0.97, needsReview: false },
    proposed: { category: 'EXCL_J', confidence: 0.98, needsReview: false, rationale: 'Gratuity payable on termination is excluded by s.2(y)(j) and sits outside the 50% group.', evidence: [LAWQ.j, Q('POLICY_COMP', 'Gratuity is paid under the Payment of Gratuity Act on separation.')] },
    gold: { category: 'EXCL_J', note: 'Express exclusion, outside the cap.' } },
  { id: 'notice_pay_exgratia', name: 'Notice Pay (ex gratia)',
    aliases: [{ system: 'GREYCSV', code: 'Notice Pay (ex-gratia)' }],
    resolution: { method: 'single-system component; no merge candidate', confidence: 1.0, needsReview: false },
    proposed: { category: 'EXCL_K', confidence: 0.87, needsReview: false, rationale: 'Ex gratia payment on termination is excluded by s.2(y)(k), outside the 50% group. Policy says notice pay in lieu is paid ex gratia at management discretion on separation.', evidence: [LAWQ.k, Q('POLICY_COMP', 'Notice pay in lieu may be paid ex gratia at management discretion.')] },
    gold: { category: 'EXCL_K', note: 'Ex gratia on termination; outside the cap.' } },
  { id: 'settlement_arrears', name: 'Settlement Arrears',
    aliases: [{ system: 'SAPHR', code: '9120' }],
    resolution: { method: 'single-system component; no merge candidate', confidence: 1.0, needsReview: false },
    proposed: { category: 'EXCL_G', confidence: 0.84, needsReview: false, rationale: 'Arrears under a long-term settlement are remuneration payable under a settlement between the parties, s.2(y)(g).', evidence: [LAWQ.g, Q('POLICY_COMP', 'Amounts under any long-term settlement are paid as set out in that settlement.')] },
    gold: { category: 'EXCL_G', note: 'Award/settlement remuneration; express exclusion.' } }
];

// ---- raw components (one per alias; labels/descriptions as exported by each system) ----
const RAW_META = {
  'SAPHR|1001': ['BASIC', 'Basic pay (monthly)'],
  'SAPHR|1010': ['DEARNESS ALW', 'Dearness allowance, legacy grade structure'],
  'SAPHR|1020': ['SPL ALW', 'Special allowance - balancing fixed component'],
  'SAPHR|1030': ['FLEXI BEN', 'Flexible benefit plan payout, grades L5+'],
  'SAPHR|1040': ['LTA', 'Leave travel allowance, monthly'],
  'SAPHR|1050': ['HRA', 'House rent allowance'],
  'SAPHR|1060': ['OT 2X', 'Overtime hours at double rate'],
  'SAPHR|1070': ['CONV ALW', 'Conveyance allowance'],
  'SAPHR|1080': ['SALES INC', 'Sales incentive, monthly variable'],
  'SAPHR|1090': ['STAT BONUS', 'Statutory bonus per PoB Act'],
  'SAPHR|1110': ['NITE SHFT ALW', 'Night shift allowance, per night'],
  'SAPHR|1130': ['FUEL REIM', 'Fuel reimbursement, bills attached'],
  'SAPHR|1150': ['UNIF ALW', 'Uniform allowance, operations'],
  'SAPHR|9001': ['ER PF', 'Employer provident fund contribution'],
  'SAPHR|9100': ['GRAT PAYT', 'Gratuity payment on exit'],
  'SAPHR|9120': ['ARREARS SETL', 'Arrears under long-term settlement'],
  'GREYCSV|BASIC_SALARY': ['BASIC_SALARY', 'Monthly basic salary'],
  'GREYCSV|SPECIAL_ALLOW': ['SPECIAL_ALLOW', 'Special allowance'],
  'GREYCSV|Flexi Benefit Plan': ['Flexi Benefit Plan', 'Flexible benefit amount, senior grades'],
  'GREYCSV|LTA Paid': ['LTA Paid', 'LTA paid with salary'],
  'GREYCSV|HRA_PAID': ['HRA_PAID', 'House rent allowance paid'],
  'GREYCSV|Conveyance': ['Conveyance', 'Conveyance paid with salary'],
  'GREYCSV|OT Pay': ['OT Pay', 'Overtime payment'],
  'GREYCSV|Sales Comm': ['Sales Comm', 'Sales commission for the month'],
  'GREYCSV|Bonus (PoB Act)': ['Bonus (PoB Act)', 'Annual bonus under Payment of Bonus Act'],
  'GREYCSV|Night Shift Allow': ['Night Shift Allow', 'Night shift allowance'],
  'GREYCSV|Retention Bonus': ['Retention Bonus', 'Monthly retention bonus per retention agreement'],
  'GREYCSV|Fuel Reimb (bills)': ['Fuel Reimb (bills)', 'Fuel reimbursed against bills'],
  'GREYCSV|Tel Reimb': ['Tel Reimb', 'Telephone reimbursed against bills'],
  'GREYCSV|Company Lease Accom (perq)': ['Company Lease Accom (perq)', 'Value of company-leased housing, perquisite'],
  'GREYCSV|PF Employer Share': ['PF Employer Share', 'Employer share of provident fund'],
  'GREYCSV|Gratuity Paid': ['Gratuity Paid', 'Gratuity paid on separation'],
  'GREYCSV|Notice Pay (ex-gratia)': ['Notice Pay (ex-gratia)', 'Notice pay in lieu, ex gratia']
};
const rawComponents = [];
canonicalComponents.forEach(function (c) {
  c.aliases.forEach(function (a) {
    const m = RAW_META[a.system + '|' + a.code];
    rawComponents.push({ system: a.system, code: a.code, label: m[0], description: m[1], monthsSeen: 3, employeesPaid: 0 });
  });
});
rawComponents.sort(function (x, y) { return x.system === y.system ? (x.code < y.code ? -1 : 1) : (x.system < y.system ? 1 : -1); });
// ---- seeded generator (mulberry32 PRNG, fully deterministic per seed) ----
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const CODES = {
  SAPHR: { basic: '1001', da: '1010', special: '1020', flexible: '1030', lta: '1040', hra: '1050', ot: '1060', conv: '1070', sales: '1080', sbonus: '1090', night: '1110', fuel: '1130', uniform: '1150', erpf: '9001', grat: '9100', arrears: '9120' },
  GREYCSV: { basic: 'BASIC_SALARY', special: 'SPECIAL_ALLOW', flexible: 'Flexi Benefit Plan', lta: 'LTA Paid', hra: 'HRA_PAID', conv: 'Conveyance', ot: 'OT Pay', sales: 'Sales Comm', sbonus: 'Bonus (PoB Act)', night: 'Night Shift Allow', retention: 'Retention Bonus', fuel: 'Fuel Reimb (bills)', tel: 'Tel Reimb', lease: 'Company Lease Accom (perq)', erpf: 'PF Employer Share', grat: 'Gratuity Paid', notice: 'Notice Pay (ex-gratia)' }
};
const ENTITY = { SAPHR: 'Northwind Bengaluru', GREYCSV: 'Northwind Pune' };
const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Ishaan', 'Rohan', 'Kabir', 'Arjun', 'Karan', 'Rahul', 'Siddharth', 'Neha', 'Priya', 'Ananya', 'Divya', 'Kavya', 'Meera', 'Pooja', 'Riya', 'Sneha', 'Isha', 'Manoj', 'Suresh', 'Ramesh', 'Anil', 'Deepak', 'Lakshmi', 'Sunita', 'Anjali', 'Farhan', 'Zoya', 'Harpreet', 'Gurpreet', 'Joseph', 'Mary', 'Thomas', 'Ayesha'];
const LAST = ['Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Patil', 'Kulkarni', 'Deshmukh', 'Gupta', 'Singh', 'Khan', 'Mehta', 'Shah', 'Joshi', 'Menon', 'Rao', 'Bhat', 'Das', 'Chatterjee', 'Banerjee', 'Pillai', 'Naidu', 'Kapoor', 'Malhotra', 'Fernandes', 'D\'Souza', 'Thakur', 'Yadav'];
const DEPTS = [['Engineering', 30], ['Sales', 14], ['Operations', 22], ['Support', 10], ['Finance', 6], ['HR', 4], ['Delivery', 14]];
const GRADES = [['L1', 3.0, 4.8, 14], ['L2', 4.8, 7.5, 22], ['L3', 7.5, 12.5, 26], ['L4', 12.5, 20, 20], ['L5', 20, 34, 11], ['L6', 34, 58, 5], ['L7', 58, 110, 2]];
const PERIODS = ['2025-12', '2026-01', '2026-02'];

function wpick(rnd, table, wIdx) {
  let tot = 0; table.forEach(function (r) { tot += r[wIdx]; });
  let x = rnd() * tot;
  for (let i = 0; i < table.length; i++) { x -= table[i][wIdx]; if (x < 0) return table[i]; }
  return table[table.length - 1];
}
const pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

function generateEmployees(seed, n) {
  const rnd = mulberry32(seed >>> 0);
  const U = function (a, b) { return a + (b - a) * rnd(); };
  const R100 = function (x) { return Math.round(x / 100) * 100; };
  const emps = [];
  for (let i = 0; i < n; i++) {
    const system = rnd() < 0.62 ? 'SAPHR' : 'GREYCSV';
    const C = CODES[system];
    const dept = wpick(rnd, DEPTS, 1)[0];
    const shift = dept === 'Operations' || dept === 'Support';
    let gr;
    if (shift) { const x = rnd(); gr = x < 0.45 ? GRADES[0] : x < 0.88 ? GRADES[1] : GRADES[2]; }
    else if (dept === 'Sales') { const x = rnd(); gr = x < 0.25 ? GRADES[1] : x < 0.6 ? GRADES[2] : x < 0.88 ? GRADES[3] : GRADES[4]; }
    else gr = wpick(rnd, GRADES, 3);
    const gIdx = GRADES.indexOf(gr);
    const grade = gr[0];
    const ctc = U(gr[1], gr[2]) * 100000;
    const G = R100(ctc / 12 / 1.08);
    const style = shift ? 'shift' : dept === 'Sales' ? 'sales' : (rnd() < 0.5 ? 'modern' : 'lowbasic');
    const pct = style === 'modern' ? U(0.40, 0.50) : style === 'lowbasic' ? U(0.28, 0.36) : style === 'sales' ? U(0.33, 0.40) : U(0.42, 0.50);
    const hasDA = system === 'SAPHR' && rnd() < 0.06;
    const basic = R100(G * pct);
    const da = hasDA ? R100(basic * U(0.08, 0.18)) : 0;
    // some low-basic structures allocate almost all of pay to HRA/conveyance/LTA (the classic exposure pattern)
    const allocated = style === 'lowbasic' && rnd() < 0.45;
    const hra = Math.round(basic * (allocated ? 1.0 : (style === 'lowbasic' || system === 'SAPHR' ? 0.5 : 0.4)));
    let conv = 0, lta = 0, flex = 0, lease = 0, retention = 0;
    if (allocated) { conv = R100(G * U(0.14, 0.20)); lta = R100(G * U(0.10, 0.16)); }
    else if (style === 'lowbasic') { conv = R100(G * U(0.05, 0.08)); lta = R100(G * U(0.04, 0.07)); }
    else if (style === 'modern') { conv = rnd() < 0.5 ? 1600 : 0; lta = rnd() < 0.35 ? Math.round(basic * 0.0833) : 0; }
    else { conv = rnd() < 0.75 ? 1600 : 0; }
    if (gIdx >= 4 && rnd() < 0.55) flex = R100(G * U(0.12, 0.22));
    if (system === 'GREYCSV' && gIdx >= 3 && rnd() < 0.12) lease = R100(G * U(0.10, 0.16));
    if (system === 'GREYCSV' && gIdx >= 2 && rnd() < 0.07) retention = Math.round(basic * 0.10);
    const fuelBase = (gIdx >= 3 && rnd() < 0.3) ? R100(U(3000, 8000)) : 0;
    const telBase = (system === 'GREYCSV' && gIdx >= 1 && rnd() < 0.35) ? R100(U(500, 2500)) : 0;
    const uniform = (system === 'SAPHR' && shift && rnd() < 0.8) ? R100(U(600, 1200)) : 0;
    const special = Math.max(0, G - (basic + da + hra + conv + lta + flex));
    const pfPolicy = rnd() < (system === 'SAPHR' ? 0.65 : 0.45) ? 'capped' : 'actual';
    const erpf = Math.round(0.12 * (pfPolicy === 'capped' ? Math.min(basic + da, 15000) : basic + da));
    // variable behaviour
    const perf = U(0.4, 1.6);
    const nightRate = (shift && rnd() < 0.45) ? R100(U(250, 450)) : 0;
    const hasOT = shift && rnd() < 0.55;
    const bonusEligible = basic <= 21000 && rnd() < 0.8;
    const bonusMonth = Math.floor(rnd() * 3);
    const bonusAmt = Math.round(Math.min(basic, 21000) * 0.0833 * 12 * U(1.0, 2.4));
    const arrearsMonth = (system === 'SAPHR' && shift && rnd() < 0.04) ? Math.floor(rnd() * 3) : -1;
    const arrearsAmt = R100(U(15000, 60000));
    // dates
    const yr = 2025 - Math.floor(Math.pow(rnd(), 1.6) * 18);
    const mo = yr === 2025 ? 1 + Math.floor(rnd() * 10) : 1 + Math.floor(rnd() * 12);
    const doj = yr + '-' + pad2(mo) + '-' + pad2(1 + Math.floor(rnd() * 28));
    const fixedTerm = yr >= 2023 && rnd() < 0.1;
    const exit = rnd() < 0.025;
    const tenureYears = 2026 - yr + (2 - mo) / 12;
    const name = FIRST[Math.floor(rnd() * FIRST.length)] + ' ' + LAST[Math.floor(rnd() * LAST.length)];
    const months = [];
    for (let m = 0; m < 3; m++) {
      const L = [];
      const push = function (code, amount) { if (amount > 0) L.push({ system: system, code: code, amount: Math.round(amount) }); };
      push(C.basic, basic);
      if (da) push(C.da, da);
      push(C.hra, hra);
      if (conv) push(C.conv, conv);
      if (lta) push(C.lta, lta);
      if (flex) push(C.flexible, flex);
      push(C.special, special);
      push(C.erpf, erpf);
      if (lease) push(C.lease, lease);
      if (retention) push(C.retention, retention);
      if (fuelBase) push(C.fuel, fuelBase * U(0.8, 1.15));
      if (telBase) push(C.tel, telBase * U(0.8, 1.1));
      if (uniform) push(C.uniform, uniform);
      if (style === 'sales') push(C.sales, rnd() < 0.1 ? 0 : basic * perf * U(0.6, 1.4) * 0.8);
      if (nightRate) push(C.night, nightRate * (6 + Math.floor(rnd() * 15)));
      if (hasOT) { const spike = rnd() < 0.12; const hrs = rnd() < 0.3 ? 0 : (spike ? 40 + Math.floor(rnd() * 30) : Math.floor(rnd() * 36)); push(C.ot, hrs * 2 * basic / 208); }
      if (bonusEligible && m === bonusMonth) push(C.sbonus, bonusAmt);
      if (arrearsMonth === m) push(C.arrears, arrearsAmt);
      if (exit && m === 2) {
        const yrs = Math.floor(tenureYears + 0.5);
        if (yrs >= 5) push(C.grat, basic * 15 / 26 * yrs);
        if (system === 'GREYCSV') push(C.notice, basic * U(1, 3));
        else if (yrs < 5) push(C.arrears, R100(U(10000, 40000)));
      }
      months.push({ period: PERIODS[m], lines: L });
    }
    emps.push({ id: (system === 'SAPHR' ? 'BLR-' : 'PUN-') + ('00000' + (i + 1)).slice(-5), entity: ENTITY[system], system: system, name: name,
      dept: dept, grade: grade, doj: doj, fixedTerm: fixedTerm, pfPolicy: pfPolicy, exited: exit, months: months });
  }
  return emps;
}

// employeesPaid etc. are measured on the default estate so the UI numbers match what Results shows
const DEFAULT_SEED = 20260221, DEFAULT_N = 1200;
let systemsAnnot;
(function annotate() {
  const emps = generateEmployees(DEFAULT_SEED, DEFAULT_N);
  const seen = {}, perSys = { SAPHR: { employees: 0, rows: 0 }, GREYCSV: { employees: 0, rows: 0 } };
  emps.forEach(function (e) {
    perSys[e.system].employees++;
    e.months.forEach(function (mo) {
      perSys[e.system].rows += mo.lines.length;
      mo.lines.forEach(function (l) {
        const k = l.system + '|' + l.code;
        const s = seen[k] || (seen[k] = { emp: {}, periods: {} });
        s.emp[e.id] = 1; s.periods[mo.period] = 1;
      });
    });
  });
  rawComponents.forEach(function (r) {
    const s = seen[r.system + '|' + r.code];
    r.employeesPaid = s ? Object.keys(s.emp).length : 0;
    r.monthsSeen = s ? Object.keys(s.periods).length : 0;
  });
  systemsAnnot = perSys;
})();


const systems = [
  { id: 'SAPHR', name: 'SAP HCM wage-type export', entity: 'Northwind Bengaluru', format: "wage type codes e.g. '1020'", employees: systemsAnnot.SAPHR.employees, rows: systemsAnnot.SAPHR.rows, codes: rawComponents.filter(function (r) { return r.system === 'SAPHR'; }).length, periods: PERIODS.slice() },
  { id: 'GREYCSV', name: 'Acquired-entity payroll CSV', entity: 'Northwind Pune (acquired 2024)', format: 'free-text column headers', employees: systemsAnnot.GREYCSV.employees, rows: systemsAnnot.GREYCSV.rows, codes: rawComponents.filter(function (r) { return r.system === 'GREYCSV'; }).length, periods: PERIODS.slice() }
];

const documents = [
  { id: 'LAW_2Y', title: 'Code on Wages 2019, s.2(y)', type: 'law', text: LAW_2Y_TEXT },
  { id: 'POLICY_COMP', title: 'Northwind Compensation Policy 2025', type: 'policy', synthetic: true, text: POLICY_COMP_TEXT },
  { id: 'POLICY_FBP', title: 'Flexible Benefit Plan rules', type: 'policy', synthetic: true, text: POLICY_FBP_TEXT },
  { id: 'OFFER_TPL', title: 'Offer letter CTC annexure template', type: 'policy', synthetic: true, text: OFFER_TPL_TEXT },
  { id: 'SC_VVM', title: 'Case note: RPFC v. Vivekananda Vidyamandir (SC, 2019)', type: 'case', text: SC_VVM_TEXT },
  { id: 'MOLE_FAQ', title: 'MoLE Labour Codes FAQs (16 Mar 2026), summary', type: 'guidance', text: MOLE_FAQ_TEXT }
];

const rejectedMerges = [
  { a: { system: 'SAPHR', code: '1060', label: 'OT 2X' }, b: { system: 'GREYCSV', code: 'Night Shift Allow', label: 'Night Shift Allow' },
    scores: { label: 0.41, coOccurrence: 0.78, amountProfile: 0.52 },
    reason: 'Both are paid to the same shift-roster population, so co-occurrence is high, but the pay basis differs: overtime is hours x 2 x hourly rate, night allowance is nights x a fixed per-night rate. Different legal character (clause (h) vs not), so merging would force one label on two components. Kept separate.' }
];
// ---- recorded agent run (authored during the build; illustrative) ----
const EVIDENCE_COUNT = canonicalComponents.reduce(function (n, c) { return n + c.proposed.evidence.length; }, 0);
const FAILED_QUOTE = { docId: 'SC_VVM', quote: 'Allowances paid to all employees form part of basic wages' };   // paraphrase: deliberately NOT verbatim
const LOWCONF = canonicalComponents.filter(function (c) { return c.proposed.confidence < 0.75; });
const PRICE = { inPerMTok: 3, outPerMTok: 15 };
const nCat = function (ids) { return ids.map(function (id) { const c = canonicalComponents.find(function (x) { return x.id === id; }); return id + ' -> ' + c.proposed.category + ' (' + c.proposed.confidence.toFixed(2) + ')'; }).join('\n'); };
const BATCH_A = ['basic', 'da', 'hra', 'conveyance', 'lta', 'overtime', 'sales_commission', 'employer_pf', 'gratuity_payout'];
const BATCH_B = ['special_allowance', 'flexible_allowance', 'statutory_bonus', 'uniform_allowance', 'company_lease_accommodation'];
const BATCH_C = ['night_shift_allowance', 'retention_bonus', 'fuel_reimbursement', 'telephone_reimbursement', 'notice_pay_exgratia', 'settlement_arrears'];
const evN = function (ids) { return ids.reduce(function (n, id) { return n + canonicalComponents.find(function (x) { return x.id === id; }).proposed.evidence.length; }, 0); };

const RUN = [
  { step: 'plan', tool: null, kind: 'plan', status: 'ok', tin: 900, tout: 380, ms: 2400,
    input: 'Goal: for every pay component in the Northwind payroll estate (2 systems), decide which clause of Code on Wages s.2(y) applies, with a verifiable quote. Constraint: read component metadata only, never employee rows.',
    output: 'Plan: 1) profile both dictionaries 2) resolve duplicates across systems 3) retrieve statute, case law and company policy 4) classify per canonical component into the closed category set 5) validate output schema 6) verify every quote against its source 7) escalate low-confidence items to a human. Output is a PROPOSED glossary; nothing is computed until a human approves it.' },
  { step: 'profile_schema', tool: 'profile_schema', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 640,
    input: 'system=SAPHR source=wage-type dictionary export + 3 payroll periods',
    output: systems[0].codes + ' wage types, ' + systems[0].employees + ' employees on the default estate, ' + systems[0].rows.toLocaleString('en-US') + ' payroll lines over 3 periods. Terse labels (SPL ALW, NITE SHFT ALW, ER PF). Only metadata and per-code counts leave the profiler; no employee identifiers.' },
  { step: 'profile_schema', tool: 'profile_schema', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 710,
    input: 'system=GREYCSV source=column headers of acquired-entity payroll CSV',
    output: systems[1].codes + ' earning columns, ' + systems[1].employees + ' employees on the default estate, ' + systems[1].rows.toLocaleString('en-US') + ' payroll lines over 3 periods. Free-text headers ("Fuel Reimb (bills)", "Company Lease Accom (perq)"). No code dictionary supplied; descriptions inferred from header text.' },
  { step: 'resolve_components', tool: 'resolve_components', kind: 'llm', status: 'ok', tin: 4100, tout: 1350, ms: 5200,
    input: 'Cluster ' + rawComponents.length + ' raw codes from 2 systems into canonical components using label similarity, co-occurrence across employees, and amount profile.',
    output: '14 merges proposed across systems (13 accepted at >= 0.85 confidence; 1 sent to critic). 7 components exist in one system only. Proposed merge needing a second look: SAPHR 1060 "OT 2X" with GREYCSV "Night Shift Allow" (co-occurrence 0.78).' },
  { step: 'resolve_components', tool: 'resolve_components', kind: 'llm', status: 'rejected', guardrail: 'merge_rejected', tin: 2300, tout: 520, ms: 3100,
    input: 'Critic pass on proposed merge: SAPHR 1060 "OT 2X" <-> GREYCSV "Night Shift Allow"',
    output: 'REJECTED. Label similarity is only 0.41. High co-occurrence is because both are paid to the shift roster, but overtime is hours x 2 x hourly rate while night allowance is nights x a fixed rate. They would take different clauses; merging would force one label on both. Kept as separate components (overtime, night_shift_allowance).' },
  { step: 'resolve_components', tool: 'resolve_components', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 90,
    input: 'Freeze alias table',
    output: canonicalComponents.length + ' canonical components, 13 cross-system merges, 7 single-system components. 2 merge decisions flagged needsReview (night_shift_allowance, flexible_allowance).' },
  { step: 'retrieve_law', tool: 'retrieve_law', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 120,
    input: 'doc=LAW_2Y section=2(y) incl. proviso',
    output: 'Retrieved Code on Wages 2019, s.2(y): inclusive part (i)-(iii), exclusions (a)-(k), proviso on one-half (' + LAW_2Y_TEXT.split(/\s+/).length + ' words).' },
  { step: 'retrieve_law', tool: 'retrieve_law', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 150,
    input: 'docs=SC_VVM, MOLE_FAQ query="allowance universally paid; exclusions capped; gratuity revised definition"',
    output: 'Retrieved case note (Vivekananda Vidyamandir, SC 2019) and MoLE FAQ summary. Note: the case concerns EPF basic wages, used here as a reasoning aid only.' },
  { step: 'retrieve_policy', tool: 'retrieve_policy', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 180,
    input: 'doc=POLICY_COMP query=per component label + description',
    output: 'Matched policy paragraphs for 19 of 20 components (settlement arrears matched only the generic long-term settlement sentence).' },
  { step: 'retrieve_policy', tool: 'retrieve_policy', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 160,
    input: 'docs=POLICY_FBP, OFFER_TPL query="flexible allowance declaration; reimbursement against bills"',
    output: 'Retrieved FBP rules (declaration decides the character of the allowance) and offer-letter Annexure A (fuel and telephone reimbursements are not part of CTC).' },
  { step: 'classify', tool: 'classify', kind: 'llm', status: 'ok', tin: 9800, tout: 2700, ms: 9800,
    input: 'batch A: ' + BATCH_A.length + ' components with clear statutory wording. Closed category set, JSON output.',
    output: nCat(BATCH_A) },
  { step: 'validate_output', tool: 'validate_output', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 14,
    input: 'validateProposal x ' + BATCH_A.length + ' (closed-set category, confidence in [0,1], >= 1 evidence, quotes verbatim)',
    output: BATCH_A.length + '/' + BATCH_A.length + ' valid, ' + evN(BATCH_A) + ' quotes verified.' },
  { step: 'classify', tool: 'classify', kind: 'llm', status: 'ok', tin: 8400, tout: 2200, ms: 8300,
    input: 'batch B: ' + BATCH_B.length + ' components needing policy context.',
    output: nCat(BATCH_B) },
  { step: 'verify_quote', tool: 'verify_quote', kind: 'tool', status: 'rejected', guardrail: 'quote_not_found', tin: 0, tout: 0, ms: 11,
    input: 'verifyQuote x ' + evN(BATCH_B) + ' (batch B)',
    output: 'FAILED 1 of ' + evN(BATCH_B) + ': special_allowance cites SC_VVM with "' + FAILED_QUOTE.quote + '", which is not a substring of SC_VVM. The model paraphrased instead of quoting. Proposal rejected; retry requested.',
    quote: FAILED_QUOTE },
  { step: 'classify', tool: 'classify', kind: 'llm', status: 'retry', guardrail: 'retry', tin: 2600, tout: 420, ms: 2900,
    input: 'retry special_allowance: "Your quote was not found verbatim in SC_VVM. Quote exact text only."',
    output: 'special_allowance -> WAGE_OTHER (0.71). Replacement quote: "' + canonicalComponents[2].proposed.evidence[1].quote + '"' },
  { step: 'verify_quote', tool: 'verify_quote', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 9,
    input: 'verifyQuote x ' + evN(BATCH_B) + ' (batch B, after retry)',
    output: evN(BATCH_B) + '/' + evN(BATCH_B) + ' quotes found verbatim.' },
  { step: 'classify', tool: 'classify', kind: 'llm', status: 'ok', tin: 9100, tout: 2600, ms: 9400,
    input: 'batch C: ' + BATCH_C.length + ' ambiguous components (shift pay, bonus-labelled pay, reimbursements, termination payments).',
    output: nCat(BATCH_C.filter(function (i) { return i !== 'notice_pay_exgratia'; })) + '\nnotice_pay_exgratia -> EXCL_L (0.80)' },
  { step: 'validate_output', tool: 'validate_output', kind: 'tool', status: 'rejected', guardrail: 'invalid_category', tin: 0, tout: 0, ms: 12,
    input: 'validateProposal x ' + BATCH_C.length,
    output: 'REJECTED notice_pay_exgratia: category "EXCL_L" is not in the closed set. The model invented a clause (l); s.2(y) ends at (k). ' + (BATCH_C.length - 1) + '/' + BATCH_C.length + ' valid. Retry requested for the one proposal.' },
  { step: 'classify', tool: 'classify', kind: 'llm', status: 'retry', guardrail: 'retry', tin: 2400, tout: 380, ms: 2600,
    input: 'retry notice_pay_exgratia: "category must be one of WAGE_CORE, WAGE_OTHER, EXCL_A..EXCL_K, OUTSIDE"',
    output: 'notice_pay_exgratia -> EXCL_K (0.87). Quote: "Notice pay in lieu may be paid ex gratia at management discretion."' },
  { step: 'validate_output', tool: 'validate_output', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 12,
    input: 'validateProposal x 1 (retry)',
    output: 'valid.' },
  { step: 'verify_quote', tool: 'verify_quote', kind: 'tool', status: 'ok', tin: 0, tout: 0, ms: 38,
    input: 'verifyQuote full sweep over all proposals',
    output: EVIDENCE_COUNT + '/' + EVIDENCE_COUNT + ' quotes verified verbatim across ' + canonicalComponents.length + ' proposals.' },
  { step: 'escalate_to_human', tool: 'escalate_to_human', kind: 'human', status: 'escalated', guardrail: 'low_confidence', tin: 0, tout: 0, ms: 25,
    input: 'Rule: confidence < 0.75, or reimbursement judgement, or merge needsReview',
    output: LOWCONF.length + ' components queued for human review, lowest first: ' + LOWCONF.slice().sort(function (a, b) { return a.proposed.confidence - b.proposed.confidence; }).map(function (c) { return c.id + ' (' + c.proposed.confidence.toFixed(2) + ')'; }).join(', ') + '. Flexible Allowance is flagged because the FBP declaration per employee decides its character.' },
  { step: 'summary', tool: null, kind: 'summary', status: 'ok', tin: 1800, tout: 520, ms: 3300,
    input: 'Summarise run for the reviewer',
    output: canonicalComponents.length + ' canonical components from ' + rawComponents.length + ' raw codes. ' + (canonicalComponents.length - LOWCONF.length) + ' proposals at or above 0.75 confidence, ' + LOWCONF.length + ' escalated. Guardrails fired 3 times: 1 merge rejected, 1 quote not found, 1 invalid category; all recovered by retry. Glossary status: PROPOSED. A human must approve it before the engine runs.' }
];
let _t = 0, _cost = 0;
const agentRun = RUN.map(function (s, i) {
  const cost = (s.tin * PRICE.inPerMTok + s.tout * PRICE.outPerMTok) / 1e6;
  _cost += cost;
  const o = { i: i + 1, t: Math.round(_t * 100) / 100, step: s.step, tool: s.tool, kind: s.kind, status: s.status, guardrail: s.guardrail || null,
    input: s.input, output: s.output, tokensIn: s.tin, tokensOut: s.tout, tokens: s.tin + s.tout, ms: s.ms,
    cost: Math.round(cost * 10000) / 10000, costTotal: Math.round(_cost * 10000) / 10000 };
  if (s.quote) o.quote = s.quote;
  _t += s.ms / 1000;
  return o;
});
const agentMeta = { note: 'Recorded run authored during the build with Claude (Anthropic); illustrative, not a live trace of the production system.', pricePerMTokIn: PRICE.inPerMTok, pricePerMTokOut: PRICE.outPerMTok,
  totalTokens: agentRun.reduce(function (n, s) { return n + s.tokens; }, 0), totalMs: Math.round(_t * 1000), totalCostUsd: Math.round(_cost * 10000) / 10000, steps: agentRun.length };

// ---- test cases (expected values hand-computed; see tests/run_tests.mjs and PLAN.md) ----
const L = function (component, category, amount) { return { component: component, category: category, amount: amount }; };
const V1 = 'CoW-2y-central-v1';
const testCases = [
  { id: 'T01', name: "Tresata's own CTC breakup, Flexible Allowance as wages (no FBP declaration)", kind: 'month', rulesetId: V1,
    proves: 'Figures from the published Tresata IIT Delhi job notification: with Flexible Allowance counted as wages, add-back is nil and codeWage is far above basic.',
    lines: [L('basic', 'WAGE_CORE', 75000), L('hra', 'EXCL_F', 37500), L('flexible_allowance', 'WAGE_OTHER', 30894), L('employer_pf', 'EXCL_C', 3000)],
    expected: { R: 146394, capped: 40500, addback: 0, codeWage: 105894 } },
  { id: 'T02', name: 'Same CTC, Flexible fully declared as LTA/conveyance', kind: 'month', rulesetId: V1,
    proves: 'Same CTC sits just under the 50% line (71,394 vs cap 73,197): a per-employee declaration moves codeWage from 105,894 to 75,000.',
    lines: [L('basic', 'WAGE_CORE', 75000), L('hra', 'EXCL_F', 37500), L('flexible_allowance', 'EXCL_D', 30894), L('employer_pf', 'EXCL_C', 3000)],
    expected: { R: 146394, capped: 71394, cap: 73197, addback: 0, codeWage: 75000 } },
  { id: 'T03', name: 'Classic 30% basic structure', kind: 'month', rulesetId: V1,
    proves: 'The textbook case: exclusions are 70% of remuneration, the excess over 50% is added back.',
    lines: [L('basic', 'WAGE_CORE', 30000), L('hra', 'EXCL_F', 30000), L('conveyance', 'EXCL_D', 20000), L('lta', 'EXCL_D', 20000)],
    expected: { R: 100000, capped: 70000, addback: 20000, codeWage: 50000 } },
  { id: 'T04', name: 'Special allowance counted as wages (Vivekananda reasoning)', kind: 'month', rulesetId: V1,
    proves: 'One classification (Special Allowance = WAGE_OTHER) removes the add-back; old PF base stays basic only.',
    lines: [L('basic', 'WAGE_CORE', 30000), L('hra', 'EXCL_F', 15000), L('special_allowance', 'WAGE_OTHER', 55000)],
    expected: { addback: 0, codeWage: 85000, oldPFBase: 30000 } },
  { id: 'T05', name: 'Overtime spike month', kind: 'month', rulesetId: V1,
    proves: 'Overtime sits inside the 50% group, so a spike month triggers an add-back even for a modest structure.',
    lines: [L('basic', 'WAGE_CORE', 20000), L('hra', 'EXCL_F', 10000), L('overtime', 'EXCL_H', 25000)],
    expected: { R: 55000, cap: 27500, addback: 7500, codeWage: 27500 } },
  { id: 'T06', name: 'Sales commission heavy', kind: 'month', rulesetId: V1,
    proves: 'Commission is inside the group; heavy variable pay produces a large add-back.',
    lines: [L('basic', 'WAGE_CORE', 25000), L('hra', 'EXCL_F', 12500), L('sales_commission', 'EXCL_I', 62500)],
    expected: { addback: 25000, codeWage: 50000 } },
  { id: 'T07', name: 'PF ceiling crossed (policy capped)', kind: 'month', rulesetId: V1,
    employee: { pfPolicy: 'capped' },
    proves: 'Employer PF is capped at Rs 15,000 of wages: Rs 12,000 basic gives 1,440; Rs 16,500 Code wage hits the ceiling and gives 1,800.',
    lines: [L('basic', 'WAGE_CORE', 12000), L('hra', 'EXCL_F', 9000), L('conveyance', 'EXCL_D', 6000), L('lta', 'EXCL_D', 6000)],
    expected: { addback: 4500, codeWage: 16500, pfOld: 1440, pfNew: 1800 } },
  { id: 'T08', name: 'Employer-PF-in-remuneration assumption flips the answer', kind: 'month', rulesetId: V1,
    proves: 'Whether employer PF counts in "all remuneration" changes add-back from 900 to 0: an explicit, toggleable ruleset assumption.',
    lines: [L('basic', 'WAGE_CORE', 40000), L('hra', 'EXCL_F', 22000), L('conveyance', 'EXCL_D', 15000), L('employer_pf', 'EXCL_C', 4800)],
    variants: [
      { label: 'include', expected: { addback: 900, codeWage: 40900 } },
      { label: 'exclude', overrides: { includeEmployerPFInRemuneration: false }, expected: { addback: 0, codeWage: 40000 } }
    ] },
  { id: 'T09', name: 'Statutory bonus month (PoB Act)', kind: 'month', rulesetId: V1,
    proves: 'A bonus paid under the PoB Act is clause (a) and still counts toward the 50% group, so a bonus month can trigger a small add-back.',
    lines: [L('basic', 'WAGE_CORE', 15000), L('hra', 'EXCL_F', 7500), L('statutory_bonus', 'EXCL_A', 10000)],
    expected: { R: 32500, addback: 1250, codeWage: 16250 } },
  { id: 'T10', name: 'Exit with gratuity payout (outside cap) and gratuity liability', kind: 'month', rulesetId: V1,
    employee: { doj: '2018-06-15', pfPolicy: 'capped' }, asOf: '2026-02-28',
    proves: 'Gratuity payout (200,000) is outside R and outside the cap; service 7y 8m rounds to 8 years; liability rises from 230,769.23 to 346,153.85.',
    lines: [L('basic', 'WAGE_CORE', 50000), L('hra', 'EXCL_F', 25000), L('special_allowance', 'WAGE_OTHER', 25000), L('gratuity_payout', 'EXCL_J', 200000)],
    expected: { R: 100000, addback: 0, codeWage: 75000, serviceYears: 8, gratuityNew: 346153.85, gratuityOld: 230769.23 } },
  { id: 'T11', name: 'Reimbursement against bills is outside remuneration', kind: 'month', rulesetId: V1,
    proves: 'OUTSIDE is not in R. If misclassified as WAGE_OTHER codeWage would be 38,000; the test asserts 30,000.',
    lines: [L('basic', 'WAGE_CORE', 30000), L('hra', 'EXCL_F', 15000), L('fuel_reimbursement', 'OUTSIDE', 8000)],
    expected: { R: 45000, addback: 0, codeWage: 30000 } },
  { id: 'T12', name: 'Cross-system entity resolution', kind: 'resolve',
    proves: 'Different codes in different systems resolve to one canonical id; look-alikes that must not merge stay apart; unknown codes return null and are excluded from R with a warning.',
    pairs: [
      { system: 'SAPHR', code: '1020', expect: 'special_allowance' }, { system: 'GREYCSV', code: 'SPECIAL_ALLOW', expect: 'special_allowance' },
      { system: 'SAPHR', code: '1001', expect: 'basic' }, { system: 'GREYCSV', code: 'BASIC_SALARY', expect: 'basic' },
      { system: 'SAPHR', code: '1060', expect: 'overtime' }, { system: 'GREYCSV', code: 'OT Pay', expect: 'overtime' },
      { system: 'SAPHR', code: '1110', expect: 'night_shift_allowance' }, { system: 'GREYCSV', code: 'Night Shift Allow', expect: 'night_shift_allowance' },
      { system: 'SAPHR', code: 'ZZ99', expect: null }, { system: 'GREYCSV', code: 'SPECIAL_ALLOW ', expect: null }, { system: 'SAPHR', code: 'SPECIAL_ALLOW', expect: null }
    ],
    expected: { 'SAPHR:1020': 'special_allowance', 'GREYCSV:SPECIAL_ALLOW': 'special_allowance', 'SAPHR:ZZ99': null } },
  { id: 'T13', name: 'What-if threshold 40% (hypothetical notification) on T03 inputs', kind: 'month', rulesetId: 'whatif-40',
    proves: 'Rule change is a version swap: the same inputs under a 40% threshold give cap 40,000, add-back 30,000 and codeWage 60,000 (+10,000 vs v1).',
    lines: [L('basic', 'WAGE_CORE', 30000), L('hra', 'EXCL_F', 30000), L('conveyance', 'EXCL_D', 20000), L('lta', 'EXCL_D', 20000)],
    variants: [{ label: '', rulesetId: 'whatif-40', expected: { cap: 40000, addback: 30000, codeWage: 60000 }, expectedDelta: { vs: V1, values: { codeWage: 10000 } } }] },
  { id: 'T14', name: 'Classifier eval vs human gold labels (honest failure report)', kind: 'eval',
    proves: 'Recorded proposals scored against human gold labels. Two deliberate misses are kept: Night Shift Allowance (proposed EXCL_E, gold WAGE_OTHER) and Retention Bonus (proposed EXCL_A, gold WAGE_OTHER). Also asserts every proposal passes validateProposal.',
    expected: { accuracy: (canonicalComponents.length - 2) / canonicalComponents.length, misses: ['night_shift_allowance', 'retention_bonus'] } },
  { id: 'T15', name: 'EPF ceiling change (v2): same inputs as T07 under the Sep 2026 ruleset', kind: 'month', rulesetId: 'CoW-2y-central-v2',
    employee: { pfPolicy: 'capped' },
    proves: 'Knowledge goes stale: with the EPF ceiling at Rs 25,000 (v2, from 17 Sep 2026) the Rs 16,500 Code wage is no longer capped, so employer PF is 12% x 16,500 = 1,980 instead of 1,800. A ruleset version swap, no code change.',
    lines: [L('basic', 'WAGE_CORE', 12000), L('hra', 'EXCL_F', 9000), L('conveyance', 'EXCL_D', 6000), L('lta', 'EXCL_D', 6000)],
    expected: { addback: 4500, codeWage: 16500, pfOld: 1440, pfNew: 1980 } }
];

const WL_DATA = {
  company: { name: 'Northwind Analytics Pvt Ltd (fictional)', note: 'All data synthetic' },
  systems: systems, rawComponents: rawComponents, documents: documents, canonicalComponents: canonicalComponents,
  rejectedMerges: rejectedMerges, agentRun: agentRun, agentMeta: agentMeta, testCases: testCases,
  periods: PERIODS, defaultSeed: DEFAULT_SEED, defaultN: DEFAULT_N, generateEmployees: generateEmployees
};
root.WL_DATA = WL_DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = WL_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
