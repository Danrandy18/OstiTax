#!/usr/bin/env node
import { readFileSync } from 'fs';
import { AustrianTaxEngine } from '../dist/calc/tax-engine/austrian-tax.engine.js';
import { centsToEuros, eurosToCents } from '../dist/calc/tax-engine/money.util.js';

const engine = new AustrianTaxEngine();
const mk = (g, t = 'employee') => ({
  employmentType: t,
  grossAmount: eurosToCents(g),
  incomePeriod: 'monthly',
  state: 'wien',
  soleEarnerDeduction: false,
  familyBonus: 'none',
  childrenUnder18: 0,
  childrenOver18WithFamilyAllowance: 0,
  benefitInKindMonthly: 0,
  benefitInKindFromCompanyCar: false,
  taxFreeAllowanceMonthly: 0,
  commuteOneWayKm: 0,
  publicTransportReasonable: true,
  commuteDaysPerMonth: 'more_than_10',
});

for (const g of [3100, 3200, 3300, 3400, 3500]) {
  const ours = centsToEuros(engine.calculate(mk(g, 'pensioner')).recurring.incomeTax);
  console.log(g, 'ours', ours);
}
