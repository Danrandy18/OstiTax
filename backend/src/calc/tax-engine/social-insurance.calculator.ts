import type { Cents } from './money.util';
import { assertCents } from './money.util';
import { AustrianState, EmploymentType } from './types';
import {
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

export function calculateSocialInsurance(
  monthlyGross: Cents,
  options: {
    employmentType: EmploymentType;
    bonusMonth?: boolean;
    state?: AustrianState;
  },
): Cents {
  if (options.employmentType === EmploymentType.PENSIONER) {
    // KV Pensionisten 6 % — sin recargo Wien ni reducción en 13./14.
    return assertCents(monthlyGross * SOCIAL_INSURANCE_PENSIONER_RATE);
  }

  // Lehrling: mismas tasas DN que Angestellte/Arbeiter (calibrado AK).
  let rate = getEmployeeSocialInsuranceRate(monthlyGross);

  if (options.bonusMonth) {
    rate -= SOCIAL_INSURANCE_BONUS_MONTH_RATE_REDUCTION;
  } else if (options.state === AustrianState.WIEN) {
    rate += SOCIAL_INSURANCE_WIEN_RATE_ADDON;
  }

  return assertCents(monthlyGross * rate);
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
