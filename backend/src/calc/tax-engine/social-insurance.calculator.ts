import type { Cents } from './money.util';
import { assertCents, centsToEuros, eurosToCents } from './money.util';
import { AustrianState, EmploymentType } from './types';
import {
  HBGL_ANNUAL_SONDERZAHLUNGEN,
  HBGL_MONTHLY_LUFEND,
  SOCIAL_INSURANCE_BONUS_MONTH_RATE_REDUCTION,
  SOCIAL_INSURANCE_EMPLOYEE_TIERS,
  SOCIAL_INSURANCE_PENSIONER_RATE,
  SOCIAL_INSURANCE_WIEN_RATE_ADDON,
} from './tables/tax-tables-2026';

export function getEmployeeSocialInsuranceRate(monthlyGross: Cents): number {
  for (const tier of SOCIAL_INSURANCE_EMPLOYEE_TIERS) {
    if (monthlyGross <= tier.upToMonthlyGross) {
      return tier.rate;
    }
  }

  return SOCIAL_INSURANCE_EMPLOYEE_TIERS.at(-1)?.rate ?? 0.1807;
}

function getBonusSocialInsuranceRate(cappedBase: Cents): number {
  return getEmployeeSocialInsuranceRate(cappedBase) - SOCIAL_INSURANCE_BONUS_MONTH_RATE_REDUCTION;
}

function capLaufendBase(monthlyGross: Cents): Cents {
  return assertCents(Math.min(monthlyGross, HBGL_MONTHLY_LUFEND));
}

function capBonusBase(
  monthlyGross: Cents,
  bonusKind: '13th' | '14th',
  monthlyCashGross: Cents,
): Cents {
  if (bonusKind === '13th') {
    return assertCents(Math.min(monthlyGross, HBGL_ANNUAL_SONDERZAHLUNGEN));
  }

  const thirteenthBase = assertCents(
    Math.min(monthlyCashGross, HBGL_ANNUAL_SONDERZAHLUNGEN),
  );
  const remainingCap = assertCents(
    Math.max(0, HBGL_ANNUAL_SONDERZAHLUNGEN - thirteenthBase),
  );

  return assertCents(Math.min(monthlyGross, remainingCap));
}

/** SV sobre KFZ-Sachbezug — calibrado AK Wien 2026 (≠ tasa DN plena). */
function calculateCompanyCarSocialInsuranceAddon(carBenefitMonthly: Cents): Cents {
  const euros = centsToEuros(carBenefitMonthly);
  if (euros <= 0) {
    return 0;
  }

  if (euros <= 600) {
    return eurosToCents(euros * 0.159);
  }

  return eurosToCents(95.4 + (euros - 600) * 0.0125);
}

export function calculateSocialInsurance(
  monthlyGross: Cents,
  options: {
    employmentType: EmploymentType;
    bonusMonth?: boolean;
    bonusKind?: '13th' | '14th';
    monthlyCashGross?: Cents;
    companyCarBenefitMonthly?: Cents;
    state?: AustrianState;
  },
): Cents {
  if (options.employmentType === EmploymentType.PENSIONER) {
    return assertCents(monthlyGross * SOCIAL_INSURANCE_PENSIONER_RATE);
  }

  if (options.bonusMonth && options.bonusKind) {
    const cappedBase = capBonusBase(
      monthlyGross,
      options.bonusKind,
      options.monthlyCashGross ?? monthlyGross,
    );
    const rate = getBonusSocialInsuranceRate(cappedBase);
    return assertCents(cappedBase * rate);
  }

  const companyCarBenefit = options.companyCarBenefitMonthly ?? 0;
  const cashGross = options.monthlyCashGross ?? monthlyGross;

  if (companyCarBenefit > 0 && cashGross < monthlyGross) {
    const cashSv = calculateSocialInsurance(cashGross, {
      employmentType: options.employmentType,
      state: options.state,
    });
    return assertCents(
      cashSv + calculateCompanyCarSocialInsuranceAddon(companyCarBenefit),
    );
  }

  const cappedBase = capLaufendBase(monthlyGross);
  let rate = getEmployeeSocialInsuranceRate(cappedBase);

  if (options.state === AustrianState.WIEN) {
    rate += SOCIAL_INSURANCE_WIEN_RATE_ADDON;
  }

  return assertCents(cappedBase * rate);
}

/** @deprecated Prefer calculateSocialInsurance with employmentType. */
export function calculateEmployeeSocialInsurance(
  monthlyGross: Cents,
  options: {
    bonusMonth?: boolean;
    state?: AustrianState;
  } = {},
): Cents {
  return calculateSocialInsurance(monthlyGross, {
    employmentType: EmploymentType.EMPLOYEE,
    ...options,
  });
}
