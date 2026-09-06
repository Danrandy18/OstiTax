import { Injectable } from '@nestjs/common';
import type { Account } from '../auth/entities/account.entity';
import { SubscriptionProvider } from '../users/enums/user-plan.enum';
import type { PlanInterval } from './enums/plan-interval.enum';
import { PaypalBillingService } from './paypal/paypal-billing.service';
import { StripeBillingService } from './stripe/stripe-billing.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly stripeBillingService: StripeBillingService,
    private readonly paypalBillingService: PaypalBillingService,
  ) {}

  createStripeCheckout(account: Account, interval: PlanInterval) {
    return this.stripeBillingService.createCheckoutSession(account, interval);
  }

  createPaypalSubscription(account: Account, interval: PlanInterval) {
    return this.paypalBillingService.createSubscription(account, interval);
  }

  /** Usado al eliminar una cuenta: cancela cualquier suscripcion activa para no dejar cobros huerfanos. */
  async cancelActiveSubscription(account: Account): Promise<void> {
    if (
      account.subscriptionProvider === SubscriptionProvider.STRIPE &&
      account.stripeSubscriptionId
    ) {
      await this.stripeBillingService.cancelSubscription(
        account.stripeSubscriptionId,
      );
      return;
    }

    if (
      account.subscriptionProvider === SubscriptionProvider.PAYPAL &&
      account.paypalSubscriptionId
    ) {
      await this.paypalBillingService.cancelSubscription(
        account.paypalSubscriptionId,
      );
    }
  }
}
