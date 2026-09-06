import { SubscriptionProvider, UserPlan } from '../../users/enums/user-plan.enum';

const ACTIVE_STRIPE_STATUSES = new Set(['active', 'trialing', 'past_due']);
const ACTIVE_PAYPAL_STATUSES = new Set(['ACTIVE', 'APPROVED']);

export interface SubscriptionLike {
  plan: UserPlan;
  subscriptionProvider: SubscriptionProvider | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
}

export function isSubscriptionActive(entity: SubscriptionLike): boolean {
  if (entity.plan !== UserPlan.PRO) {
    return false;
  }

  if (
    entity.subscriptionCurrentPeriodEnd &&
    entity.subscriptionCurrentPeriodEnd.getTime() < Date.now()
  ) {
    return false;
  }

  if (!entity.subscriptionStatus) {
    return false;
  }

  if (entity.subscriptionProvider === SubscriptionProvider.STRIPE) {
    return ACTIVE_STRIPE_STATUSES.has(entity.subscriptionStatus);
  }

  if (entity.subscriptionProvider === SubscriptionProvider.PAYPAL) {
    return ACTIVE_PAYPAL_STATUSES.has(entity.subscriptionStatus);
  }

  return false;
}

export function isStatusStillActive(
  provider: SubscriptionProvider | null,
  status: string,
): boolean {
  if (provider === SubscriptionProvider.STRIPE) {
    return ACTIVE_STRIPE_STATUSES.has(status);
  }
  if (provider === SubscriptionProvider.PAYPAL) {
    return ACTIVE_PAYPAL_STATUSES.has(status);
  }
  return false;
}
