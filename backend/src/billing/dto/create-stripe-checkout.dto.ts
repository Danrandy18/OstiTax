import { IsEnum } from 'class-validator';
import { PlanInterval } from '../enums/plan-interval.enum';

export class CreateStripeCheckoutDto {
  @IsEnum(PlanInterval)
  interval!: PlanInterval;
}
