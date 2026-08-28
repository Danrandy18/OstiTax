import type { Cents } from './money.util';
import { assertCents } from './money.util';
import { calculateCommuteDeduction } from './commute-pauschale.calculator';
import { calculateSocialInsurance } from './social-insurance.calculator';
import type { CalculationInput } from './types';
import { EmploymentType, FamilyBonusType } from './types';
import {
  ALLEINVERDIENER_ABSETZBETRAG_MONTHLY,
  FAMILY_BONUS_FULL_UNIT_MONTHLY,
  FAMILY_BONUS_SHARED_UNIT_MONTHLY,
  JAHRESSECHSTEL_FREIBETRAG_13TH,
  JAHRESSECHSTEL_RATE,
  LOHNSTEUER_MONTHLY_ZONES,
  PENSION_LOHNSTEUER_MONTHLY_ZONES,
} from './tables/tax-tables-2026';

function getZone(
  bmg: Cents,
  zones: readonly { upToBmg: number; rate: number; allowance: Cents }[],
): { rate: number; allowance: Cents } {
  for (const zone of zones) {
    if (bmg <= zone.upToBmg) {
      return { rate: zone.rate, allowance: zone.allowance };
    }
  }

  const last = zones.at(-1);
  return {
    rate: last?.rate ?? 0.4,
    allowance: last?.allowance ?? 0,
  };
}

function getFamilyBonusDeduction(input: CalculationInput): Cents {
  if (input.familyBonus === FamilyBonusType.NONE) {
    return 0;
  }

  const childCount =
    input.childrenUnder18 + input.childrenOver18WithFamilyAllowance;
  const multiplier = 1 + childCount;

  if (input.familyBonus === FamilyBonusType.FULL) {
    return assertCents(FAMILY_BONUS_FULL_UNIT_MONTHLY * multiplier);
  }

  return assertCents(FAMILY_BONUS_SHARED_UNIT_MONTHLY * multiplier);
}

function getAlleinverdienerDeduction(input: CalculationInput): Cents {
  if (!input.soleEarnerDeduction) {
    return 0;
  }

  const hasChildren =
    input.childrenUnder18 + input.childrenOver18WithFamilyAllowance > 0;

  return hasChildren ? ALLEINVERDIENER_ABSETZBETRAG_MONTHLY : 0;
}

function getAdditionalDeductions(input: CalculationInput): Cents {
  return assertCents(
    getFamilyBonusDeduction(input) +
      getAlleinverdienerDeduction(input) +
      calculateCommuteDeduction(input) +
      input.taxFreeAllowanceMonthly,
  );
}

function calculateRecurringIncomeTax(
  assessmentGross: Cents,
  socialInsurance: Cents,
  input: CalculationInput,
): Cents {
  const isPensioner = input.employmentType === EmploymentType.PENSIONER;
  const zones = isPensioner
    ? PENSION_LOHNSTEUER_MONTHLY_ZONES
    : LOHNSTEUER_MONTHLY_ZONES;

  // Empleado/Lehrling: tramo con SV sin recargo Wien (calibrado AK).
  // Pensionista: tramo con BMG = Brutto − KV.
  const zoneBmg = isPensioner
    ? assertCents(assessmentGross - socialInsurance)
    : assertCents(
        assessmentGross -
          calculateSocialInsurance(assessmentGross, {
            employmentType: input.employmentType,
            bonusMonth: false,
            // sin state → sin Wien addon
          }),
      );

  const taxBmg = assertCents(
    assessmentGross - socialInsurance - getAdditionalDeductions(input),
  );

  if (taxBmg <= 0) {
    return 0;
  }

  const { rate, allowance } = getZone(zoneBmg, zones);
  return assertCents(Math.max(0, taxBmg * rate - allowance));
}

function calculateBonusMonthIncomeTax(
  assessmentGross: Cents,
  socialInsurance: Cents,
  bonusKind: '13th' | '14th',
): Cents {
  const taxableBase = assertCents(assessmentGross - socialInsurance);

  if (bonusKind === '13th') {
    const reducedBase = assertCents(taxableBase - JAHRESSECHSTEL_FREIBETRAG_13TH);
    return assertCents(
      Math.max(0, Math.round(reducedBase * JAHRESSECHSTEL_RATE)),
    );
  }

  return assertCents(
    Math.max(0, Math.round(taxableBase * JAHRESSECHSTEL_RATE)),
  );
}

export function calculateIncomeTax(
  assessmentGross: Cents,
  socialInsurance: Cents,
  input: CalculationInput,
  paymentType: 'recurring' | '13th' | '14th',
): Cents {
  if (paymentType === 'recurring') {
    return calculateRecurringIncomeTax(assessmentGross, socialInsurance, input);
  }

  return calculateBonusMonthIncomeTax(
    assessmentGross,
    socialInsurance,
    paymentType,
  );
}
