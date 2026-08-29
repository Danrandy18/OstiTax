import akReferenceCases from './reference/ak-reference-cases.json';
import akDeductionCases from './reference/ak-deduction-reference-cases.json';
import akExtraFieldsCases from './reference/ak-extra-fields-cases.json';
import akPhase2Cases from './reference/ak-phase2-cases.json';
import akPhase3Cases from './reference/ak-phase3-cases.json';
import akPhase4Cases from './reference/ak-phase4-cases.json';
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
    companyCar: raw.companyCar as CalculationInput['companyCar'],
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
  expect(Math.abs(centsToEuros(actual) - expected)).toBeLessThanOrEqual(0.001);
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

describe('AustrianTaxEngine — Jahressechstel exceso', () => {
  it('applies tarifa normal al excedente sobre el sechstel en el 13.º', () => {
    const input = toInput({
      employmentType: 'employee',
      grossAmount: 5000,
      incomePeriod: 'monthly',
      state: 'wien',
    });
    const result = engine.calculate(input);
    // Jahressechstel = 10000; base 13.º tras SV ≈ 4142 → sin excedente, solo 6 %
    expectEuros(result.thirteenth.incomeTax, 211.59);
  });
});

describe('AustrianTaxEngine — Fase 2 (48 %, Freigrenze, pensiones altas)', () => {
  runAkSuite(akPhase2Cases as AkCase[], ['recurring', 'thirteenth', 'fourteenth']);
});

describe('AustrianTaxEngine — Fase 3 (pensiones, SV acumulada 13./14.)', () => {
  runAkSuite(akPhase3Cases as AkCase[]);
});

describe('AustrianTaxEngine — Fase 4 (55 %, KFZ integrado)', () => {
  runAkSuite(akPhase4Cases as AkCase[]);
});
