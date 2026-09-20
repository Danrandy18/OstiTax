import type { CalculationResult } from '../tax-engine/types';
import { centsToEuros } from '../tax-engine/money.util';

export class PaymentBreakdownDto {
  gross: number;
  socialInsurance: number;
  incomeTax: number;
  net: number;

  static fromBreakdown(row: CalculationResult['recurring']): PaymentBreakdownDto {
    return {
      gross: centsToEuros(row.gross),
      socialInsurance: centsToEuros(row.socialInsurance),
      incomeTax: centsToEuros(row.incomeTax),
      net: centsToEuros(row.net),
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
      usage,
    };
  }
}
