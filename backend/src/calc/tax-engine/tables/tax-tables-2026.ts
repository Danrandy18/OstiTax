import type { Cents } from '../money.util';
import { eurosToCents } from '../money.util';
import { CommuteDaysPerMonth } from '../types';

/**
 * Tablas fiscales vigentes — Stand Jänner 2026 (AK / BMF).
 * Validadas contra bruttonetto.arbeiterkammer.at (regresión automatizada).
 */
export const TAX_TABLE_YEAR = 2026;

/** Höchstbeitragsgrundlage laufender Bezug (ÖGK 2026). */
export const HBGL_MONTHLY_LUFEND: Cents = eurosToCents(6930);

/** Höchstbeitragsgrundlage Sonderzahlungen anual (13./14.). */
export const HBGL_ANNUAL_SONDERZAHLUNGEN: Cents = eurosToCents(13860);

/** Geringfügigkeitsgrenze mensual 2026. */
export const GERINGFUEGIGKEIT_MONTHLY: Cents = eurosToCents(551.1);

/** Freibetrag Jahressechstel (13.º sueldo / Urlaubsgeld). */
export const JAHRESSECHSTEL_FREIBETRAG_13TH: Cents = eurosToCents(620);

/** Freigrenze Jahressechstel anual (§ 67 EStG). */
export const JAHRESSECHSTEL_FREIGRENZE_ANNUAL: Cents = eurosToCents(2100);

/**
 * Sin retención del 6 % en SZ si el Brutto laufend anualizado (×12) no supera
 * 15.600 € — calibrado AK (1300 €/mes → 13.º LS = 0; 1310 € → LS > 0).
 */
export const JAHRESSECHSTEL_LOW_LUFEND_ANNUAL: Cents = eurosToCents(15600);

/** Tasa Jahressechstel sobre base imponible (Brutto − SV). */
export const JAHRESSECHSTEL_RATE = 0.06;

/**
 * Cuota DN (empleado) de Sozialversicherung por tramo de Brutto mensual.
 * 13./14. Bezug: −1 punto porcentual.
 */
export const SOCIAL_INSURANCE_EMPLOYEE_TIERS = [
  { upToMonthlyGross: eurosToCents(2266), rate: 0.1512 },
  { upToMonthlyGross: eurosToCents(2449), rate: 0.1612 },
  { upToMonthlyGross: eurosToCents(2625.99), rate: 0.1712 },
  { upToMonthlyGross: Number.POSITIVE_INFINITY, rate: 0.1807 },
] as const;

export const SOCIAL_INSURANCE_BONUS_MONTH_RATE_REDUCTION = 0.01;

/** Recargo DN Wien (Bundesland 0) — calibrado AK Stand 2026. */
export const SOCIAL_INSURANCE_WIEN_RATE_ADDON = 0.0025;

/**
 * Lohnsteuer sobre BMG mensual (Brutto − SV − Freibeträge).
 * Tarifa Steuerreform 2025/2026: 20 % / 30 % / 40 % con Steuerabsetzbeträge embebidos.
 * tax = max(0, bmg × rate − allowance)
 */
export const LOHNSTEUER_MONTHLY_ZONES = [
  {
    upToBmg: eurosToCents(2071.99),
    rate: 0.2,
    allowance: eurosToCents(269.18),
  },
  {
    upToBmg: eurosToCents(3049.2),
    rate: 0.3,
    allowance: eurosToCents(453.55),
  },
  {
    upToBmg: eurosToCents(5863.75),
    rate: 0.4,
    allowance: eurosToCents(758.47),
  },
  {
    upToBmg: eurosToCents(9747.75),
    rate: 0.48,
    allowance: eurosToCents(1228.44),
  },
  {
    upToBmg: eurosToCents(83747.74),
    rate: 0.5,
    allowance: eurosToCents(1400.58),
  },
  {
    upToBmg: Number.POSITIVE_INFINITY,
    rate: 0.55,
    allowance: eurosToCents(5570.65),
  },
] as const;

/** Pensionistenabsetzbetrag — básico anual (BMF 2026). */
export const PENSIONISTEN_ABSETZBETRAG_BASIC_ANNUAL: Cents = eurosToCents(1020);

/** Pensionistenabsetzbetrag erhöht — máximo anual (BMF 2026). */
export const PENSIONISTEN_ABSETZBETRAG_ENHANCED_ANNUAL: Cents = eurosToCents(1502);

/** Einschleifung del absetzbetrag erhöht (ingreso anual de pensión). */
export const PENSIONISTEN_ENHANCED_FULL_UP_TO_ANNUAL: Cents = eurosToCents(24616);
export const PENSIONISTEN_ENHANCED_ZERO_FROM_ANNUAL: Cents = eurosToCents(31494);

/** Krankenversicherung Pensionisten (seit 2025/2026). */
export const SOCIAL_INSURANCE_PENSIONER_RATE = 0.06;

/**
 * Lohnsteuer Pensionisten (laufend) — calibrado AK Stand 2026.
 * tax = max(0, bmg × rate − allowance); BMG = Brutto − KV.
 */
export const PENSION_LOHNSTEUER_MONTHLY_ZONES = [
  {
    upToBmg: eurosToCents(2071.99),
    rate: 0.2,
    allowance: eurosToCents(297.78),
  },
  {
    upToBmg: eurosToCents(2599.99),
    rate: 0.3,
    allowance: eurosToCents(437.26),
  },
  {
    upToBmg: eurosToCents(5863.75),
    rate: 0.4,
    allowance: eurosToCents(690.92),
  },
  {
    upToBmg: Number.POSITIVE_INFINITY,
    rate: 0.48,
    allowance: eurosToCents(1181.83),
  },
] as const;

/** AVAB/AEAB anual por número de hijos (BMF 2026, calibrado AK). */
export const ALLEINVERDIENER_ABSETZBETRAG_ANNUAL = [
  eurosToCents(612),
  eurosToCents(828),
  eurosToCents(1101),
] as const;

export const ALLEINVERDIENER_EXTRA_CHILD_ANNUAL: Cents = eurosToCents(273);

/** Familienbonus Plus — unidad mensual calibrada AK (2000 €/año, 2 Einheiten bei 1 Kind). */
export const FAMILY_BONUS_FULL_UNIT_MONTHLY: Cents = eurosToCents(83.34);
export const FAMILY_BONUS_SHARED_UNIT_MONTHLY: Cents = eurosToCents(41.67);

/** Pendlereuro: 6 €/km/año (Stand 2026). */
export const PENDLER_EURO_RATE_ANNUAL = 6;

/**
 * Aliquotierung Pendlerpauschale por días de desplazamiento (BMF / AK).
 * ≥11 días → 100 %; 8–10 → 2/3; 4–7 → 1/3; <4 → sin derecho.
 */
export const PENDLER_DAY_FACTORS: Record<CommuteDaysPerMonth, number> = {
  [CommuteDaysPerMonth.LESS_THAN_4]: 0,
  [CommuteDaysPerMonth.FROM_4_TO_7]: 1 / 3,
  [CommuteDaysPerMonth.FROM_8_TO_10]: 2 / 3,
  [CommuteDaysPerMonth.MORE_THAN_10]: 1,
};

/** Kleine Pendlerpauschale (ÖV zumutbar, ≥20 km). */
const PENDLER_KLEINE_BANDS = [
  { minKm: 20, maxKm: 40, annual: eurosToCents(696) },
  { minKm: 40, maxKm: 60, annual: eurosToCents(1356) },
  { minKm: 60, maxKm: Number.POSITIVE_INFINITY, annual: eurosToCents(2016) },
] as const;

/** Große Pendlerpauschale (ÖV no zumutbar, ≥2 km). */
const PENDLER_GROSSE_BANDS = [
  { minKm: 2, maxKm: 20, annual: eurosToCents(372) },
  { minKm: 20, maxKm: 40, annual: eurosToCents(1476) },
  { minKm: 40, maxKm: 60, annual: eurosToCents(2568) },
  { minKm: 60, maxKm: Number.POSITIVE_INFINITY, annual: eurosToCents(3672) },
] as const;

function lookupPendlerBand(
  km: number,
  bands: readonly { minKm: number; maxKm: number; annual: Cents }[],
): Cents {
  for (const band of bands) {
    if (km >= band.minKm && km < band.maxKm) {
      return band.annual;
    }
  }
  return 0;
}

/** Pendlerpauschale anual según distancia y zumutbarkeit ÖV (Freibetrag). */
export function getPendlerpauschaleAnnual(
  oneWayKm: number,
  publicTransportReasonable: boolean,
): Cents {
  if (publicTransportReasonable) {
    if (oneWayKm < 20) {
      return 0;
    }
    return lookupPendlerBand(oneWayKm, PENDLER_KLEINE_BANDS);
  }

  if (oneWayKm < 2) {
    return 0;
  }
  return lookupPendlerBand(oneWayKm, PENDLER_GROSSE_BANDS);
}

export function getAlleinverdienerAbsetzbetragAnnual(childCount: number): Cents {
  if (childCount <= 0) {
    return 0;
  }
  if (childCount <= ALLEINVERDIENER_ABSETZBETRAG_ANNUAL.length) {
    return ALLEINVERDIENER_ABSETZBETRAG_ANNUAL[childCount - 1];
  }
  const base =
    ALLEINVERDIENER_ABSETZBETRAG_ANNUAL[
      ALLEINVERDIENER_ABSETZBETRAG_ANNUAL.length - 1
    ];
  const extraChildren = childCount - ALLEINVERDIENER_ABSETZBETRAG_ANNUAL.length;
  return base + extraChildren * ALLEINVERDIENER_EXTRA_CHILD_ANNUAL;
}

/**
 * Pensionistenabsetzbetrag mensual con Einschleifung (BMF 2026).
 * Nota: las zonas pensionista actuales ya incorporan el efecto en los allowances AK;
 * usar solo si se refactorizan las tablas pensionistas.
 */
export function getPensionistenAbsetzbetragMonthly(monthlyPensionGross: Cents): Cents {
  const annualGross = monthlyPensionGross * 12;

  if (annualGross <= PENSIONISTEN_ENHANCED_FULL_UP_TO_ANNUAL) {
    return assertCentsMonthly(PENSIONISTEN_ABSETZBETRAG_ENHANCED_ANNUAL / 12);
  }

  if (annualGross >= PENSIONISTEN_ENHANCED_ZERO_FROM_ANNUAL) {
    return assertCentsMonthly(PENSIONISTEN_ABSETZBETRAG_BASIC_ANNUAL / 12);
  }

  const range =
    PENSIONISTEN_ENHANCED_ZERO_FROM_ANNUAL -
    PENSIONISTEN_ENHANCED_FULL_UP_TO_ANNUAL;
  const enhancedSlice =
    PENSIONISTEN_ABSETZBETRAG_ENHANCED_ANNUAL -
    PENSIONISTEN_ABSETZBETRAG_BASIC_ANNUAL;
  const factor =
    (PENSIONISTEN_ENHANCED_ZERO_FROM_ANNUAL - annualGross) / range;

  return assertCentsMonthly(
    (PENSIONISTEN_ABSETZBETRAG_BASIC_ANNUAL + enhancedSlice * factor) / 12,
  );
}

function assertCentsMonthly(value: number): Cents {
  return Math.round(value);
}
