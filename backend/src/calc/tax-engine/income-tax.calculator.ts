import type { Cents } from './money.util';
import { assertCents } from './money.util';
import { calculateCommuteAllowances } from './commute-pauschale.calculator';
import { hasCompanyCarBenefit } from './benefit-in-kind.util';
import { calculateSocialInsurance } from './social-insurance.calculator';
import type { CalculationInput } from './types';
import { EmploymentType, FamilyBonusType } from './types';
import {
  FAMILY_BONUS_FULL_UNIT_MONTHLY,
  FAMILY_BONUS_SHARED_UNIT_MONTHLY,
  JAHRESSECHSTEL_FREIBETRAG_13TH,
  JAHRESSECHSTEL_FREIGRENZE_ANNUAL,
  JAHRESSECHSTEL_LOW_LUFEND_ANNUAL,
  JAHRESSECHSTEL_RATE,
  LOHNSTEUER_MONTHLY_ZONES,
  PENSION_LOHNSTEUER_MONTHLY_ZONES,
  getAlleinverdienerAbsetzbetragAnnual,
} from './tables/tax-tables-2026';
import { getPensionExtraAbsetzbetrag } from './pension-extra-absetzbetrag';

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

function getChildCount(input: CalculationInput): number {
  return input.childrenUnder18 + input.childrenOver18WithFamilyAllowance;
}

/** Freibeträge: reducen la BMG (Pendlerpauschale, Freibetragsbescheid). */
function getFreibetraege(input: CalculationInput): Cents {
  const { pauschaleMonthly } = calculateCommuteAllowances(input);
  return assertCents(pauschaleMonthly + input.taxFreeAllowanceMonthly);
}

/** Absetzbeträge: reducen la cuota de LS (AVAB, Familienbonus, Pendlereuro). */
function getAbsetzbetaege(input: CalculationInput, zoneBmg?: Cents): Cents {
  const childCount = getChildCount(input);
  let total = 0;

  if (input.soleEarnerDeduction && childCount > 0) {
    total += getAlleinverdienerAbsetzbetragAnnual(childCount) / 12;
  }

  if (input.familyBonus !== FamilyBonusType.NONE && childCount > 0) {
    const unit =
      input.familyBonus === FamilyBonusType.FULL
        ? FAMILY_BONUS_FULL_UNIT_MONTHLY
        : FAMILY_BONUS_SHARED_UNIT_MONTHLY;
    // AK: (1 + Kinder) Einheiten × halber Monatsbetrag pro Einheit.
    total += unit * (1 + childCount);
  }

  total += calculateCommuteAllowances(input).pendlereuroMonthly;

  if (input.employmentType === EmploymentType.PENSIONER && zoneBmg !== undefined) {
    total += getPensionExtraAbsetzbetrag(zoneBmg);
  }

  return assertCents(total);
}

function getIncomeTaxZones(input: CalculationInput) {
  return input.employmentType === EmploymentType.PENSIONER
    ? PENSION_LOHNSTEUER_MONTHLY_ZONES
    : LOHNSTEUER_MONTHLY_ZONES;
}

function getZoneBmg(
  assessmentGross: Cents,
  input: CalculationInput,
): Cents {
  const isPensioner = input.employmentType === EmploymentType.PENSIONER;

  if (isPensioner) {
    return assertCents(
      assessmentGross -
        calculateSocialInsurance(assessmentGross, {
          employmentType: input.employmentType,
        }),
    );
  }

  // Empleado/Lehrling: tramo con SV sin recargo Wien (calibrado AK).
  return assertCents(
    assessmentGross -
      calculateSocialInsurance(assessmentGross, {
        employmentType: input.employmentType,
        bonusMonth: false,
      }),
  );
}

function calculateProgressiveTax(
  taxBmg: Cents,
  zoneBmg: Cents,
  input: CalculationInput,
  absetzbetaege: Cents,
): Cents {
  if (taxBmg <= 0) {
    return 0;
  }

  const zones = getIncomeTaxZones(input);
  const { rate, allowance } = getZone(zoneBmg, zones);
  const grossTax = assertCents(Math.max(0, taxBmg * rate - allowance));
  return assertCents(Math.max(0, grossTax - absetzbetaege));
}

function calculateRecurringIncomeTax(
  assessmentGross: Cents,
  socialInsurance: Cents,
  input: CalculationInput,
): Cents {
  const freibetraege = getFreibetraege(input);
  const taxBmg = assertCents(
    assessmentGross - socialInsurance - freibetraege,
  );
  const zoneBmg = hasCompanyCarBenefit(input)
    ? taxBmg
    : getZoneBmg(assessmentGross, input);
  const absetzbetaege = getAbsetzbetaege(input, zoneBmg);

  return calculateProgressiveTax(taxBmg, zoneBmg, input, absetzbetaege);
}

function isJahressechstelPreferentialWithheld(
  monthlyCashGross: Cents,
): boolean {
  const jahressechstel = monthlyCashGross * 2;
  const annualLaufend = monthlyCashGross * 12;

  if (jahressechstel <= JAHRESSECHSTEL_FREIGRENZE_ANNUAL) {
    return false;
  }

  if (annualLaufend <= JAHRESSECHSTEL_LOW_LUFEND_ANNUAL) {
    return false;
  }

  return true;
}

function calculateBonusMonthIncomeTax(
  assessmentGross: Cents,
  socialInsurance: Cents,
  bonusKind: '13th' | '14th',
  monthlyCashGross: Cents,
  input: CalculationInput,
): Cents {
  const taxableBase = assertCents(assessmentGross - socialInsurance);
  const jahressechstel = assertCents(monthlyCashGross * 2);

  const preferentialBase = Math.min(taxableBase, jahressechstel);
  const excessBase = assertCents(Math.max(0, taxableBase - jahressechstel));

  let preferentialTax = 0;
  if (isJahressechstelPreferentialWithheld(monthlyCashGross)) {
    if (bonusKind === '13th') {
      const reducedBase = assertCents(
        Math.max(0, preferentialBase - JAHRESSECHSTEL_FREIBETRAG_13TH),
      );
      preferentialTax = assertCents(
        Math.max(0, Math.round(reducedBase * JAHRESSECHSTEL_RATE)),
      );
    } else {
      preferentialTax = assertCents(
        Math.max(0, Math.round(preferentialBase * JAHRESSECHSTEL_RATE)),
      );
    }
  }

  const excessTax =
    excessBase > 0
      ? calculateProgressiveTax(excessBase, excessBase, input, 0)
      : 0;

  return assertCents(preferentialTax + excessTax);
}

export function calculateIncomeTax(
  assessmentGross: Cents,
  socialInsurance: Cents,
  input: CalculationInput,
  paymentType: 'recurring' | '13th' | '14th',
  monthlyCashGross?: Cents,
): Cents {
  if (paymentType === 'recurring') {
    return calculateRecurringIncomeTax(assessmentGross, socialInsurance, input);
  }

  return calculateBonusMonthIncomeTax(
    assessmentGross,
    socialInsurance,
    paymentType,
    monthlyCashGross ?? assessmentGross,
    input,
  );
}
