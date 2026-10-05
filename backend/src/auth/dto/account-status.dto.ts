import type { Account } from '../entities/account.entity';
import { UserPlan } from '../../users/enums/user-plan.enum';

export class AccountStatusDto {
  id!: string;
  email!: string;
  name!: string | null;
  plan!: UserPlan;
  isPro!: boolean;
  subscriptionProvider!: string | null;
  subscriptionStatus!: string | null;
  subscriptionCurrentPeriodEnd!: string | null;
  /** Cancelada: Pro sigue hasta subscriptionCurrentPeriodEnd y no se renueva. */
  subscriptionCancelAtPeriodEnd!: boolean;
  /** false en cuentas solo de Google: no hay contrasena que cambiar. */
  hasPassword!: boolean;
  locale!: string;

  static fromEntity(account: Account, isPro: boolean): AccountStatusDto {
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      plan: account.plan,
      isPro,
      subscriptionProvider: account.subscriptionProvider,
      subscriptionStatus: account.subscriptionStatus,
      subscriptionCurrentPeriodEnd: account.subscriptionCurrentPeriodEnd
        ? account.subscriptionCurrentPeriodEnd.toISOString()
        : null,
      subscriptionCancelAtPeriodEnd: account.subscriptionCancelAtPeriodEnd,
      hasPassword: !!account.passwordHash,
      locale: account.locale,
    };
  }
}
