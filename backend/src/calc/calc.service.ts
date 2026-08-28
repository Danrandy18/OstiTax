import { Injectable } from '@nestjs/common';
import { CalculateRequestDto } from './dto/calculate-request.dto';
import { CalculateResponseDto } from './dto/calculate-response.dto';
import { AustrianTaxEngine } from './tax-engine/austrian-tax.engine';
import { eurosToCents } from './tax-engine/money.util';
import type { CalculationInput } from './tax-engine/types';

@Injectable()
export class CalcService {
  private readonly engine = new AustrianTaxEngine();

  calculate(dto: CalculateRequestDto): CalculateResponseDto {
    const input: CalculationInput = {
      employmentType: dto.employmentType,
      grossAmount: eurosToCents(dto.grossAmount),
      incomePeriod: dto.incomePeriod,
      state: dto.state,
      soleEarnerDeduction: dto.soleEarnerDeduction,
      familyBonus: dto.familyBonus,
      childrenUnder18: dto.childrenUnder18,
      childrenOver18WithFamilyAllowance:
        dto.childrenOver18WithFamilyAllowance,
      benefitInKindMonthly: eurosToCents(dto.benefitInKindMonthly),
      benefitInKindFromCompanyCar: dto.benefitInKindFromCompanyCar,
      taxFreeAllowanceMonthly: eurosToCents(dto.taxFreeAllowanceMonthly),
      commuteOneWayKm: dto.commuteOneWayKm,
      publicTransportReasonable: dto.publicTransportReasonable,
      commuteDaysPerMonth: dto.commuteDaysPerMonth,
    };

    return CalculateResponseDto.fromResult(this.engine.calculate(input));
  }
}
