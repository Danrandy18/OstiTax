#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Use compiled dist if available
let engineMod;
try {
  engineMod = await import('../dist/calc/tax-engine/austrian-tax.engine.js');
} catch {
  console.error('Build backend first: npm run build');
  process.exit(1);
}
const money = await import('../dist/calc/tax-engine/money.util.js');

const { AustrianTaxEngine } = engineMod;
const { eurosToCents, centsToEuros } = money;
const e = new AustrianTaxEngine();

function run(label, extra = {}) {
  const r = e.calculate({
    employmentType: 'employee',
    grossAmount: eurosToCents(3000),
    incomePeriod: 'monthly',
    state: 'wien',
    soleEarnerDeduction: false,
    familyBonus: 'none',
    childrenUnder18: 0,
    childrenOver18WithFamilyAllowance: 0,
    benefitInKindMonthly: eurosToCents(0),
    benefitInKindFromCompanyCar: false,
    taxFreeAllowanceMonthly: eurosToCents(0),
    commuteOneWayKm: 0,
    publicTransportReasonable: true,
    commuteDaysPerMonth: 'more_than_10',
    ...extra,
  });
  console.log(label);
  console.log(
    `  SV ${centsToEuros(r.recurring.socialInsurance)} | LS ${centsToEuros(r.recurring.incomeTax)} | Net ${centsToEuros(r.recurring.net)}`,
  );
  console.log(
    `  13 SV ${centsToEuros(r.thirteenth.socialInsurance)} | LS ${centsToEuros(r.thirteenth.incomeTax)}`,
  );
}

run('baseline');
run('sach 200', { benefitInKindMonthly: eurosToCents(200) });
run('frei 100', { taxFreeAllowanceMonthly: eurosToCents(100) });
run('both', {
  benefitInKindMonthly: eurosToCents(200),
  taxFreeAllowanceMonthly: eurosToCents(100),
});
