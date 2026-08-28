import type { Cents } from './money.util';
import { eurosToCents } from './money.util';
const KFZ_CO2_THRESHOLDS: readonly { fromYear: number; maxCo2: number }[] = [
  { fromYear: 2026, maxCo2: 126 },
  { fromYear: 2025, maxCo2: 126 },
  { fromYear: 2024, maxCo2: 129 },
  { fromYear: 2023, maxCo2: 132 },
  { fromYear: 2022, maxCo2: 135 },
  { fromYear: 2021, maxCo2: 138 },
];

const KFZ_RATE_LOW = 0.015;
const KFZ_RATE_HIGH = 0.02;

export interface CompanyCarBenefitInput {
  /** Anschaffungskosten incl. USt/NoVA (€). */
  acquisitionCost: number;
  /** CO₂ g/km (WLTP). */
  co2GramsPerKm: number;
  /** Año de primera matriculación. */
  firstRegistrationYear: number;
  /** Halber Sachbezug (uso privado muy limitado). */
  halfBenefit?: boolean;
}

function getCo2Threshold(firstRegistrationYear: number): number {
  for (const row of KFZ_CO2_THRESHOLDS) {
    if (firstRegistrationYear >= row.fromYear) {
      return row.maxCo2;
    }
  }
  return KFZ_CO2_THRESHOLDS.at(-1)?.maxCo2 ?? 126;
}

/**
 * KFZ-Sachbezug mensual (Sachbezugswerteverordnung / BMF).
 * Eléctrico 0 g/km → 0 €.
 */
export function calculateCompanyCarBenefitMonthly(
  input: CompanyCarBenefitInput,
): Cents {
  if (input.co2GramsPerKm <= 0) {
    return 0;
  }

  const threshold = getCo2Threshold(input.firstRegistrationYear);
  const isLowCo2 = input.co2GramsPerKm <= threshold;
  const rate = isLowCo2 ? KFZ_RATE_LOW : KFZ_RATE_HIGH;
  const capEuros = isLowCo2 ? 720 : 960;
  let monthlyEuros = Math.min(input.acquisitionCost * rate, capEuros);

  if (input.halfBenefit) {
    monthlyEuros /= 2;
  }

  return eurosToCents(monthlyEuros);
}
