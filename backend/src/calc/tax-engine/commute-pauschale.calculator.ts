import type { Cents } from './money.util';
import { assertCents, eurosToCents } from './money.util';
import type { CalculationInput } from './types';
import { CommuteDaysPerMonth } from './types';
import { hasCompanyCarBenefit } from './benefit-in-kind.util';
import {
  PENDLER_DAY_FACTORS,
  PENDLER_EURO_RATE_ANNUAL,
  getPendlerpauschaleAnnual,
} from './tables/tax-tables-2026';

export interface CommuteAllowances {
  /** Freibetrag mensual (reduce BMG). */
  pauschaleMonthly: Cents;
  /** Absetzbetrag mensual (reduce cuota LS). */
  pendlereuroMonthly: Cents;
}

/**
 * Pendlerpauschale (Freibetrag) + Pendlereuro (Absetzbetrag), Stand 2026 / AK.
 * Firmenauto para commuting anula ambos (§ EStG / BMF Pendlerrechner).
 */
export function calculateCommuteAllowances(
  input: CalculationInput,
): CommuteAllowances {
  const empty = { pauschaleMonthly: 0, pendlereuroMonthly: 0 };

  if (hasCompanyCarBenefit(input) || input.commuteOneWayKm < 2) {
    return empty;
  }

  const dayFactor = PENDLER_DAY_FACTORS[input.commuteDaysPerMonth];
  if (dayFactor <= 0) {
    return empty;
  }

  const annualPauschale = getPendlerpauschaleAnnual(
    input.commuteOneWayKm,
    input.publicTransportReasonable,
  );
  const pauschaleMonthly = assertCents((annualPauschale / 12) * dayFactor);

  const annualPendlereuro =
    input.commuteOneWayKm * PENDLER_EURO_RATE_ANNUAL * dayFactor;
  const pendlereuroMonthly = eurosToCents(annualPendlereuro / 12);

  return { pauschaleMonthly, pendlereuroMonthly };
}

/** @deprecated Use calculateCommuteAllowances().pauschaleMonthly only. */
export function calculateCommuteDeduction(input: CalculationInput): Cents {
  const { pauschaleMonthly, pendlereuroMonthly } =
    calculateCommuteAllowances(input);
  return assertCents(pauschaleMonthly + pendlereuroMonthly);
}
