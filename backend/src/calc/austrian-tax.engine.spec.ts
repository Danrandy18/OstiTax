import akReferenceCases from './reference/ak-reference-cases.json';
import akDeductionCases from './reference/ak-deduction-reference-cases.json';
import akExtraFieldsCases from './reference/ak-extra-fields-cases.json';
import { AustrianTaxEngine } from './tax-engine/austrian-tax.engine';
import { centsToEuros, eurosToCents } from './tax-engine/money.util';
import type { CalculationInput } from './tax-engine/types';
import {
  AustrianState,
  CommuteDaysPerMonth,
  EmploymentType,
  FamilyBonusType,
  IncomePeriod,
} from './tax-engine/types';

const engine = new AustrianTaxEngine();

type AkCase = {
  id: string;
  input: Record<string, unknown>;
  expected: Record<
    string,
    { gross: number; socialInsurance: number; incomeTax: number; net: number }
  >;
};

function toInput(raw: AkCase['input']): CalculationInput {
  return {
    employmentType: raw.employmentType as EmploymentType,
    grossAmount: eurosToCents(raw.grossAmount as number),
    incomePeriod: (raw.incomePeriod as IncomePeriod) ?? IncomePeriod.MONTHLY,
    state: (raw.state as AustrianState) ?? AustrianState.WIEN,
    soleEarnerDeduction: (raw.soleEarnerDeduction as boolean) ?? false,
    familyBonus: (raw.familyBonus as FamilyBonusType) ?? FamilyBonusType.NONE,
    childrenUnder18: (raw.childrenUnder18 as number) ?? 0,
    childrenOver18WithFamilyAllowance:
      (raw.childrenOver18WithFamilyAllowance as number) ?? 0,
    benefitInKindMonthly: eurosToCents((raw.benefitInKindMonthly as number) ?? 0),
    benefitInKindFromCompanyCar:
      (raw.benefitInKindFromCompanyCar as boolean) ?? false,
    taxFreeAllowanceMonthly: eurosToCents(
      (raw.taxFreeAllowanceMonthly as number) ?? 0,
    ),
    commuteOneWayKm: (raw.commuteOneWayKm as number) ?? 0,
    publicTransportReasonable: (raw.publicTransportReasonable as boolean) ?? true,
    commuteDaysPerMonth:
      (raw.commuteDaysPerMonth as CommuteDaysPerMonth) ??
      CommuteDaysPerMonth.MORE_THAN_10,
  };
}

function expectEuros(actual: number, expected: number): void {
  expect(Math.abs(centsToEuros(actual) - expected)).toBeLessThanOrEqual(0.011);
}

function runAkSuite(cases: AkCase[], keys?: Array<keyof AkCase['expected']>): void {
  const compareKeys = keys ?? (['recurring', 'thirteenth', 'fourteenth', 'annual'] as const);

  it.each(cases)('$id matches AK reference', (testCase) => {
    const result = engine.calculate(toInput(testCase.input));

    for (const key of compareKeys) {
      const expected = testCase.expected[key as string];
      if (!expected) {
        continue;
      }
      const actual = result[key as 'recurring' | 'thirteenth' | 'fourteenth' | 'annual'];
      expectEuros(actual.gross, expected.gross);
      expectEuros(actual.socialInsurance, expected.socialInsurance);
      expectEuros(actual.incomeTax, expected.incomeTax);
      expectEuros(actual.net, expected.net);
    }
  });
}

describe('AustrianTaxEngine — AK baseline Wien', () => {
  runAkSuite(akReferenceCases as AkCase[]);
});

describe('AustrianTaxEngine — AK deducciones Wien', () => {
  runAkSuite(akDeductionCases as AkCase[]);
});

describe('AustrianTaxEngine — Sachbezug, Freibetrag, Lehrling, Pensionist', () => {
  runAkSuite(akExtraFieldsCases as AkCase[], [
    'recurring',
    'thirteenth',
    'fourteenth',
  ]);
});
