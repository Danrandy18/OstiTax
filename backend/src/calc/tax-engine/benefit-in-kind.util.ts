import type { Cents } from './money.util';
import { assertCents } from './money.util';
import { calculateCompanyCarBenefitMonthly } from './company-car-benefit.calculator';
import type { CalculationInput } from './types';

/** Sachbezug mensual: manual + KFZ calculado (si hay datos del vehículo). */
export function resolveBenefitInKindMonthly(input: CalculationInput): Cents {
  let total = input.benefitInKindMonthly;

  if (input.companyCar) {
    total += calculateCompanyCarBenefitMonthly(input.companyCar);
  }

  return assertCents(total);
}

export function hasCompanyCarBenefit(input: CalculationInput): boolean {
  return input.benefitInKindFromCompanyCar || input.companyCar !== undefined;
}
