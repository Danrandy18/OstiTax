import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AustrianState,
  CommuteDaysPerMonth,
  EmploymentType,
  FamilyBonusType,
  IncomePeriod,
} from '../tax-engine/types';
import { SelfEmployedKind } from '../tax-engine/self-employed.calculator';
import { CompanyCarDto } from './company-car.dto';

export class CalculateRequestDto {
  @IsEnum(EmploymentType)
  employmentType: EmploymentType = EmploymentType.EMPLOYEE;

  /** Brutto en euros (p. ej. 3000.00). */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  grossAmount: number;

  @IsEnum(IncomePeriod)
  incomePeriod: IncomePeriod = IncomePeriod.MONTHLY;

  @IsEnum(AustrianState)
  state: AustrianState = AustrianState.WIEN;

  @IsBoolean()
  soleEarnerDeduction = false;

  @IsEnum(FamilyBonusType)
  familyBonus: FamilyBonusType = FamilyBonusType.NONE;

  @IsInt()
  @Min(0)
  childrenUnder18 = 0;

  @IsInt()
  @Min(0)
  childrenOver18WithFamilyAllowance = 0;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  benefitInKindMonthly = 0;

  @IsBoolean()
  benefitInKindFromCompanyCar = false;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyCarDto)
  companyCar?: CompanyCarDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxFreeAllowanceMonthly = 0;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commuteOneWayKm = 0;

  @IsBoolean()
  publicTransportReasonable = true;

  @IsEnum(CommuteDaysPerMonth)
  commuteDaysPerMonth: CommuteDaysPerMonth = CommuteDaysPerMonth.FROM_4_TO_7;

  /** Solo autonomos: Gewerbetreibende o Neue Selbständige. */
  @IsOptional()
  @IsEnum(SelfEmployedKind)
  selfEmployedKind: SelfEmployedKind = SelfEmployedKind.TRADE;

  /** Solo autonomos: en los tres primeros años la SVS cobra provisionalmente sobre la base minima. */
  @IsOptional()
  @IsBoolean()
  selfEmployedFirstYears = false;
}
