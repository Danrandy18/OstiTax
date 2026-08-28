import type { User } from '../entities/user.entity';
import { UserPlan } from '../enums/user-plan.enum';

export class UserStatusDto {
  deviceId!: string;
  plan!: UserPlan;
  freeAttemptsRemaining!: number;
  isPro!: boolean;
  subscriptionProvider!: string | null;
  subscriptionStatus!: string | null;
  subscriptionCurrentPeriodEnd!: string | null;

  static fromEntity(user: User, isPro: boolean): UserStatusDto {
    return {
      deviceId: user.deviceId,
      plan: user.plan,
      freeAttemptsRemaining: user.freeAttemptsRemaining,
      isPro,
      subscriptionProvider: user.subscriptionProvider,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd
        ? user.subscriptionCurrentPeriodEnd.toISOString()
        : null,
    };
  }
}
