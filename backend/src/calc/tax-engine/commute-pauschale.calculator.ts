import type { Cents } from './money.util';
import { assertCents, eurosToCents } from './money.util';
import type { CalculationInput } from './types';
import { CommuteDaysPerMonth } from './types';
import {
  PENDLER_KM_RATE_MONTHLY,
  PENDLER_PUBLIC_TRANSPORT_FACTOR,
  PENDLER_DAY_FACTORS,
} from './tables/tax-tables-2026';

export function calculateCommuteDeduction(input: CalculationInput): Cents {
  if (input.commuteOneWayKm <= 0) {
    return 0;
  }

  const dayFactor = PENDLER_DAY_FACTORS[input.commuteDaysPerMonth];
  const kmAllowance =
    input.commuteOneWayKm *
    PENDLER_KM_RATE_MONTHLY *
    dayFactor *
    (input.publicTransportReasonable ? PENDLER_PUBLIC_TRANSPORT_FACTOR : 1);

  return assertCents(eurosToCents(kmAllowance));
}
