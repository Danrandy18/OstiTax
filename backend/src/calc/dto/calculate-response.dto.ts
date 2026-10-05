import type { SelfEmployedResult } from '../tax-engine/self-employed.calculator';
import type { CalculationResult } from '../tax-engine/types';
import { centsToEuros } from '../tax-engine/money.util';

export class PaymentBreakdownDto {
  gross: number;
  socialInsurance: number;
  incomeTax: number;
  net: number;

  static fromBreakdown(
    row: CalculationResult['recurring'],
  ): PaymentBreakdownDto {
    return {
      gross: centsToEuros(row.gross),
      socialInsurance: centsToEuros(row.socialInsurance),
      incomeTax: centsToEuros(row.incomeTax),
      net: centsToEuros(row.net),
    };
  }
}

/** Detalle del calculo de autonomos, en euros. */
export class SelfEmployedBreakdownDto {
  annualProfit!: number;
  contributionBase!: number;
  insured!: boolean;
  minimumBaseApplied!: boolean;
  maximumBaseApplied!: boolean;
  pension!: number;
  health!: number;
  provision!: number;
  accident!: number;
  socialInsurance!: number;
  profitAfterSocialInsurance!: number;
  gewinnfreibetrag!: number;
  taxableIncome!: number;
  tariffTax!: number;
  familyBonus!: number;
  soleEarnerCredit!: number;
  incomeTax!: number;
  net!: number;
  quarterlyTaxPrepayment!: number;
  quarterlySocialInsurance!: number;
  provisionalSocialInsurance!: number | null;
  estimatedBackPayment!: number | null;

  static fromResult(r: SelfEmployedResult): SelfEmployedBreakdownDto {
    const euros = (v: number | null) => (v === null ? null : centsToEuros(v));
    return {
      annualProfit: centsToEuros(r.annualProfit),
      contributionBase: centsToEuros(r.contributionBase),
      insured: r.insured,
      minimumBaseApplied: r.minimumBaseApplied,
      maximumBaseApplied: r.maximumBaseApplied,
      pension: centsToEuros(r.pension),
      health: centsToEuros(r.health),
      provision: centsToEuros(r.provision),
      accident: centsToEuros(r.accident),
      socialInsurance: centsToEuros(r.socialInsurance),
      profitAfterSocialInsurance: centsToEuros(r.profitAfterSocialInsurance),
      gewinnfreibetrag: centsToEuros(r.gewinnfreibetrag),
      taxableIncome: centsToEuros(r.taxableIncome),
      tariffTax: centsToEuros(r.tariffTax),
      familyBonus: centsToEuros(r.familyBonus),
      soleEarnerCredit: centsToEuros(r.soleEarnerCredit),
      incomeTax: centsToEuros(r.incomeTax),
      net: centsToEuros(r.net),
      quarterlyTaxPrepayment: centsToEuros(r.quarterlyTaxPrepayment),
      quarterlySocialInsurance: centsToEuros(r.quarterlySocialInsurance),
      provisionalSocialInsurance: euros(r.provisionalSocialInsurance),
      estimatedBackPayment: euros(r.estimatedBackPayment),
    };
  }
}

export class UsageDto {
  plan!: string;
  isPro!: boolean;
  freeAttemptsRemaining!: number;
  freeAttemptsResetAt!: string | null;
}

export class CalculateResponseDto {
  tableYear: number;
  recurring: PaymentBreakdownDto;
  thirteenth: PaymentBreakdownDto;
  fourteenth: PaymentBreakdownDto;
  annual: PaymentBreakdownDto;
  selfEmployed?: SelfEmployedBreakdownDto;
  usage?: UsageDto;

  static fromResult(
    result: CalculationResult,
    usage?: UsageDto,
  ): CalculateResponseDto {
    return {
      tableYear: result.tableYear,
      recurring: PaymentBreakdownDto.fromBreakdown(result.recurring),
      thirteenth: PaymentBreakdownDto.fromBreakdown(result.thirteenth),
      fourteenth: PaymentBreakdownDto.fromBreakdown(result.fourteenth),
      annual: PaymentBreakdownDto.fromBreakdown(result.annual),
      ...(result.selfEmployed
        ? {
            selfEmployed: SelfEmployedBreakdownDto.fromResult(
              result.selfEmployed,
            ),
          }
        : {}),
      usage,
    };
  }
}
