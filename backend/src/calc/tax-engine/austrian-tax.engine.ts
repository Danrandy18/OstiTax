import type { Cents } from './money.util';
import { assertCents } from './money.util';
import { calculateIncomeTax } from './income-tax.calculator';
import {
  hasCompanyCarBenefit,
  resolveBenefitInKindMonthly,
} from './benefit-in-kind.util';
import { calculateSocialInsurance } from './social-insurance.calculator';
import { TAX_TABLE_YEAR } from './tables/tax-tables-2026';
import type {
  CalculationInput,
  CalculationResult,
  PaymentBreakdown,
} from './types';
import { IncomePeriod } from './types';

function normalizeMonthlyGross(input: CalculationInput): Cents {
  if (input.incomePeriod === IncomePeriod.MONTHLY) {
    return input.grossAmount;
  }

  // Brutto anual ÷ 14 (modelo austriaco con 13.º y 14.º).
  return assertCents(input.grossAmount / 14);
}

/**
 * Base para SV/LS en el mes laufend: Brutto cash + Sachbezug.
 * AK: el Sachbezug NO se aplica a 13./14. Bezug.
 * El flag Firmenauto (sachbezugKFZ) no añade importe por sí solo:
 * el usuario debe indicar el valor en benefitInKindMonthly.
 */
function recurringAssessmentGross(
  monthlyCashGross: Cents,
  input: CalculationInput,
): Cents {
  return assertCents(monthlyCashGross + resolveBenefitInKindMonthly(input));
}

function buildPaymentBreakdown(
  monthlyCashGross: Cents,
  input: CalculationInput,
  paymentType: 'recurring' | '13th' | '14th',
): PaymentBreakdown {
  const isBonusMonth = paymentType === '13th' || paymentType === '14th';
  const assessment = isBonusMonth
    ? monthlyCashGross
    : recurringAssessmentGross(monthlyCashGross, input);
  const companyCarBenefit =
    !isBonusMonth && hasCompanyCarBenefit(input)
      ? resolveBenefitInKindMonthly(input)
      : 0;

  const socialInsurance = calculateSocialInsurance(assessment, {
    employmentType: input.employmentType,
    bonusMonth: isBonusMonth,
    bonusKind: isBonusMonth ? paymentType : undefined,
    monthlyCashGross,
    companyCarBenefitMonthly: companyCarBenefit,
    state: input.state,
  });
  const incomeTax = calculateIncomeTax(
    assessment,
    socialInsurance,
    input,
    paymentType,
    monthlyCashGross,
  );

  return {
    gross: monthlyCashGross,
    socialInsurance,
    incomeTax,
    // Netto en efectivo: Brutto cash − SV − LS.
    net: assertCents(monthlyCashGross - socialInsurance - incomeTax),
  };
}

function sumBreakdowns(...rows: PaymentBreakdown[]): PaymentBreakdown {
  return rows.reduce(
    (acc, row) => ({
      gross: assertCents(acc.gross + row.gross),
      socialInsurance: assertCents(acc.socialInsurance + row.socialInsurance),
      incomeTax: assertCents(acc.incomeTax + row.incomeTax),
      net: assertCents(acc.net + row.net),
    }),
    { gross: 0, socialInsurance: 0, incomeTax: 0, net: 0 },
  );
}

export class AustrianTaxEngine {
  calculate(input: CalculationInput): CalculationResult {
    const monthlyGross = normalizeMonthlyGross(input);
    const recurring = buildPaymentBreakdown(monthlyGross, input, 'recurring');
    const thirteenth = buildPaymentBreakdown(monthlyGross, input, '13th');
    const fourteenth = buildPaymentBreakdown(monthlyGross, input, '14th');

    return {
      tableYear: TAX_TABLE_YEAR,
      recurring,
      thirteenth,
      fourteenth,
      annual: sumBreakdowns(
        ...Array.from({ length: 12 }, () => recurring),
        thirteenth,
        fourteenth,
      ),
    };
  }
}
