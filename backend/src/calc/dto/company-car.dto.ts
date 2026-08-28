import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyCarDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  acquisitionCost: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  co2GramsPerKm: number;

  @IsInt()
  @Min(1900)
  firstRegistrationYear: number;

  @IsOptional()
  @IsBoolean()
  halfBenefit?: boolean;
}
