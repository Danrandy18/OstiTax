import { assertCents, type Cents, eurosToCents } from './money.util';
import { getAlleinverdienerAbsetzbetragAnnual } from './tables/tax-tables-2026';
import { FamilyBonusType } from './types';

/**
 * Autonomos (Selbstständige) 2026: cotizaciones a la SVS segun GSVG y Einkommensteuer anual.
 *
 * A diferencia de la nomina, aqui no hay retencion mensual ni 13./14. Bezug: el punto de
 * partida es el beneficio anual (Gewinn) antes de las cotizaciones, las cotizaciones se pagan
 * trimestralmente a la SVS y la Einkommensteuer se liquida en la declaracion anual, con pagos a
 * cuenta (Vorauszahlungen). Fuentes: SVS (tipos y bases 2026), BMF (tarifa 2026, Familienbonus),
 * § 10 EStG (Gewinnfreibetrag).
 */

/** Gewerbetreibende (GSVG) o Neue Selbständige: mismas cotizaciones salvo la Versicherungsgrenze. */
export enum SelfEmployedKind {
  TRADE = 'trade',
  NEW_SELF_EMPLOYED = 'new_self_employed',
}

/** SVS 2026: Pensionsversicherung, Krankenversicherung y Selbständigenvorsorge (GSVG). */
export const SVS_PENSION_RATE = 0.185;
export const SVS_HEALTH_RATE = 0.068;
export const SVS_PROVISION_RATE = 0.0153;
/** Unfallversicherung: importe fijo mensual (SVS 2026). */
export const SVS_ACCIDENT_MONTHLY: Cents = eurosToCents(12.96);
/** Mindest- y Höchstbeitragsgrundlage 2026 (mensual). */
export const SVS_MIN_BASE_MONTHLY: Cents = eurosToCents(551.1);
export const SVS_MAX_BASE_MONTHLY: Cents = eurosToCents(8085);
/** Neue Selbständige: por debajo de esta renta anual no hay seguro obligatorio (igual a 12 × base minima). */
export const NEW_SELF_EMPLOYED_INSURANCE_LIMIT_ANNUAL: Cents =
  12 * SVS_MIN_BASE_MONTHLY;

/** Grundfreibetrag del Gewinnfreibetrag: 15 % de los primeros 33.000 € de beneficio. */
export const GEWINNFREIBETRAG_RATE = 0.15;
export const GEWINNFREIBETRAG_BASE_LIMIT: Cents = eurosToCents(33000);

/** Tarifa anual de la Einkommensteuer 2026 (§ 33 EStG, BMF). */
const INCOME_TAX_BRACKETS_2026: readonly { upTo: Cents; rate: number }[] = [
  { upTo: eurosToCents(13539), rate: 0 },
  { upTo: eurosToCents(21992), rate: 0.2 },
  { upTo: eurosToCents(36458), rate: 0.3 },
  { upTo: eurosToCents(70365), rate: 0.4 },
  { upTo: eurosToCents(104859), rate: 0.48 },
  { upTo: eurosToCents(1000000), rate: 0.5 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.55 },
];

/** Familienbonus Plus anual por hijo (BMF 2026; mitad si se reparte entre los progenitores). */
export const FAMILY_BONUS_UNDER_18_ANNUAL: Cents = eurosToCents(2000.16);
export const FAMILY_BONUS_OVER_18_ANNUAL: Cents = eurosToCents(700.08);

export interface SelfEmployedInput {
  /** Beneficio anual antes de las cotizaciones a la SVS. */
  annualProfit: Cents;
  kind: SelfEmployedKind;
  /** En los tres primeros años la SVS cobra provisionalmente sobre la base minima. */
  firstYears: boolean;
  soleEarnerDeduction: boolean;
  familyBonus: FamilyBonusType;
  childrenUnder18: number;
  childrenOver18WithFamilyAllowance: number;
}

export interface SelfEmployedResult {
  annualProfit: Cents;
  /** Base anual de cotizacion tras aplicar los limites minimo y maximo. */
  contributionBase: Cents;
  insured: boolean;
  minimumBaseApplied: boolean;
  maximumBaseApplied: boolean;
  pension: Cents;
  health: Cents;
  provision: Cents;
  accident: Cents;
  socialInsurance: Cents;
  /** Beneficio tras cotizaciones (las cotizaciones son gastos deducibles). */
  profitAfterSocialInsurance: Cents;
  gewinnfreibetrag: Cents;
  taxableIncome: Cents;
  /** Impuesto segun la tarifa, antes de los Absetzbeträge. */
  tariffTax: Cents;
  familyBonus: Cents;
  soleEarnerCredit: Cents;
  incomeTax: Cents;
  net: Cents;
  /** Pago a cuenta trimestral orientativo de la Einkommensteuer. */
  quarterlyTaxPrepayment: Cents;
  quarterlySocialInsurance: Cents;
  /** Solo en los primeros años: lo que la SVS cobra provisionalmente y la diferencia estimada. */
  provisionalSocialInsurance: Cents | null;
  estimatedBackPayment: Cents | null;
}

/** Einkommensteuer segun la tarifa progresiva anual. */
export function annualTariffTax(taxableIncome: Cents): Cents {
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of INCOME_TAX_BRACKETS_2026) {
    if (taxableIncome <= lower) break;
    tax += (Math.min(taxableIncome, upTo) - lower) * rate;
    lower = upTo;
  }
  return assertCents(tax);
}

/** Cotizaciones SVS anuales sobre una base anual ya limitada. */
function contributionsOn(base: Cents, insured: boolean) {
  if (!insured) {
    return { pension: 0, health: 0, provision: 0, accident: 0 };
  }
  return {
    pension: assertCents(base * SVS_PENSION_RATE),
    health: assertCents(base * SVS_HEALTH_RATE),
    provision: assertCents(base * SVS_PROVISION_RATE),
    accident: 12 * SVS_ACCIDENT_MONTHLY,
  };
}

function familyBonusAnnual(input: SelfEmployedInput): Cents {
  if (input.familyBonus === FamilyBonusType.NONE) return 0;
  const full =
    input.childrenUnder18 * FAMILY_BONUS_UNDER_18_ANNUAL +
    input.childrenOver18WithFamilyAllowance * FAMILY_BONUS_OVER_18_ANNUAL;
  return input.familyBonus === FamilyBonusType.SHARED
    ? assertCents(full / 2)
    : full;
}

export function calculateSelfEmployed(
  input: SelfEmployedInput,
): SelfEmployedResult {
  const profit = Math.max(0, input.annualProfit);
  const minBase = 12 * SVS_MIN_BASE_MONTHLY;
  const maxBase = 12 * SVS_MAX_BASE_MONTHLY;

  // Neue Selbständige por debajo de la Versicherungsgrenze no estan asegurados obligatoriamente;
  // los Gewerbetreibende cotizan siempre, como minimo sobre la base minima.
  const insured =
    input.kind === SelfEmployedKind.TRADE ||
    profit > NEW_SELF_EMPLOYED_INSURANCE_LIMIT_ANNUAL;
  const contributionBase = insured
    ? Math.min(Math.max(profit, minBase), maxBase)
    : 0;

  const c = contributionsOn(contributionBase, insured);
  const socialInsurance = c.pension + c.health + c.provision + c.accident;

  const profitAfterSocialInsurance = Math.max(0, profit - socialInsurance);
  const gewinnfreibetrag = assertCents(
    Math.min(profitAfterSocialInsurance, GEWINNFREIBETRAG_BASE_LIMIT) *
      GEWINNFREIBETRAG_RATE,
  );
  const taxableIncome = profitAfterSocialInsurance - gewinnfreibetrag;
  const tariffTax = annualTariffTax(taxableIncome);

  const childCount =
    input.childrenUnder18 + input.childrenOver18WithFamilyAllowance;
  const familyBonus = Math.min(tariffTax, familyBonusAnnual(input));
  const soleEarnerCredit =
    input.soleEarnerDeduction && childCount > 0
      ? getAlleinverdienerAbsetzbetragAnnual(childCount)
      : 0;
  // Igual que en la nomina: los Absetzbeträge no dejan la cuota por debajo de cero.
  const incomeTax = Math.max(0, tariffTax - familyBonus - soleEarnerCredit);

  let provisionalSocialInsurance: Cents | null = null;
  let estimatedBackPayment: Cents | null = null;
  if (input.firstYears && insured) {
    const provisional = contributionsOn(minBase, true);
    provisionalSocialInsurance =
      provisional.pension +
      provisional.health +
      provisional.provision +
      provisional.accident;
    estimatedBackPayment = Math.max(
      0,
      socialInsurance - provisionalSocialInsurance,
    );
  }

  return {
    annualProfit: profit,
    contributionBase,
    insured,
    minimumBaseApplied: insured && profit < minBase,
    maximumBaseApplied: insured && profit > maxBase,
    ...c,
    socialInsurance,
    profitAfterSocialInsurance,
    gewinnfreibetrag,
    taxableIncome,
    tariffTax,
    familyBonus,
    soleEarnerCredit,
    incomeTax,
    net: profit - socialInsurance - incomeTax,
    quarterlyTaxPrepayment: assertCents(incomeTax / 4),
    quarterlySocialInsurance: assertCents(
      (provisionalSocialInsurance ?? socialInsurance) / 4,
    ),
    provisionalSocialInsurance,
    estimatedBackPayment,
  };
}
