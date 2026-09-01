import { Injectable } from '@nestjs/common';
import type { User } from '../users/entities/user.entity';
import type { PlanInterval } from './enums/plan-interval.enum';
import { PaypalBillingService } from './paypal/paypal-billing.service';
import { StripeBillingService } from './stripe/stripe-billing.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly stripeBillingService: StripeBillingService,
    private readonly paypalBillingService: PaypalBillingService,
  ) {}

  createStripeCheckout(user: User, interval: PlanInterval) {
    return this.stripeBillingService.createCheckoutSession(user, interval);
  }

  createPaypalSubscription(user: User, interval: PlanInterval) {
    return this.paypalBillingService.createSubscription(user, interval);
  }
}
