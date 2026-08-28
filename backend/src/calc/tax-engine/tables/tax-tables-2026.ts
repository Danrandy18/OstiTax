import type { Cents } from '../money.util';
import { eurosToCents } from '../money.util';
import { CommuteDaysPerMonth } from '../types';

/**
 * Tablas fiscales vigentes — Stand Jänner 2026 (AK / BMF).
 * Validadas contra bruttonetto.arbeiterkammer.at (regresión automatizada).
 */
export const TAX_TABLE_YEAR = 2026;

/** Freibetrag Jahressechstel (13.º sueldo / Urlaubsgeld). */
export const JAHRESSECHSTEL_FREIBETRAG_13TH: Cents = eurosToCents(620);

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
 * Lohnsteuer sobre BMG mensual (Brutto − SV − deducciones).
 * Tarifa Steuerreform 2025/2026: 20 % / 30 % / 40 % con Steuerabsetzbeträge mensuales.
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
    upToBmg: Number.POSITIVE_INFINITY,
    rate: 0.4,
    allowance: eurosToCents(758.47),
  },
] as const;

/** Krankenversicherung Pensionisten (seit 2025/2026). */
export const SOCIAL_INSURANCE_PENSIONER_RATE = 0.06;

/**
 * Lohnsteuer Pensionisten (laufend) — calibrado AK Stand 2026.
 * tax = max(0, bmg × rate − allowance); BMG = Brutto − KV 6 %.
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
    upToBmg: Number.POSITIVE_INFINITY,
    rate: 0.4,
    allowance: eurosToCents(690.92),
  },
] as const;

/** Alleinverdiener-/Alleinerzieherabsetzbetrag mensual (con hijos a cargo). */
export const ALLEINVERDIENER_ABSETZBETRAG_MONTHLY: Cents = eurosToCents(170);

/** Familienbonus Plus — importe mensual por unidad (AK calibrado). */
export const FAMILY_BONUS_FULL_UNIT_MONTHLY: Cents = eurosToCents(277.8);
export const FAMILY_BONUS_SHARED_UNIT_MONTHLY: Cents = eurosToCents(138.9);

/** Pendlerpauschale mensual por km (pendeltage > 10, sin transporte público). */
export const PENDLER_KM_RATE_MONTHLY = 6.5868;
/** Reducción Öffis zumutbar — calibrado AK (25 km → 99,67 € de 164,67 €). */
export const PENDLER_PUBLIC_TRANSPORT_FACTOR = 99.67 / 164.67;
export const PENDLER_DAY_FACTORS: Record<CommuteDaysPerMonth, number> = {
  [CommuteDaysPerMonth.LESS_THAN_4]: 0.45,
  [CommuteDaysPerMonth.FROM_4_TO_7]: 0.65,
  [CommuteDaysPerMonth.FROM_8_TO_10]: 0.85,
  [CommuteDaysPerMonth.MORE_THAN_10]: 1,
};
