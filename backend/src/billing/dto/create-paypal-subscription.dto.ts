import { IsEnum } from 'class-validator';
import { PlanInterval } from '../enums/plan-interval.enum';

export class CreatePaypalSubscriptionDto {
  @IsEnum(PlanInterval)
  interval!: PlanInterval;
}
