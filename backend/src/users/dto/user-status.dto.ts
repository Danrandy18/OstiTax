import type { User } from '../entities/user.entity';
import { UserPlan } from '../enums/user-plan.enum';

export class UserStatusDto {
  deviceId!: string;
  plan!: UserPlan;
  freeAttemptsRemaining!: number;
  /** Cuando se restauran los intentos gratis (ISO), o null si no se ha gastado ninguno. */
  freeAttemptsResetAt!: string | null;
  isPro!: boolean;
  subscriptionProvider!: string | null;
  subscriptionStatus!: string | null;
  subscriptionCurrentPeriodEnd!: string | null;

  static fromEntity(
    user: User,
    isPro: boolean,
    freeAttemptsResetAt: string | null = null,
  ): UserStatusDto {
    return {
      deviceId: user.deviceId,
      plan: user.plan,
      freeAttemptsRemaining: user.freeAttemptsRemaining,
      freeAttemptsResetAt,
      isPro,
      subscriptionProvider: user.subscriptionProvider,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd
        ? user.subscriptionCurrentPeriodEnd.toISOString()
        : null,
    };
  }
}
