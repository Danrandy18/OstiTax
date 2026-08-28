import { Injectable } from '@nestjs/common';
import type { User } from '../users/entities/user.entity';
import { PaypalBillingService } from './paypal/paypal-billing.service';
import { StripeBillingService } from './stripe/stripe-billing.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly stripeBillingService: StripeBillingService,
    private readonly paypalBillingService: PaypalBillingService,
  ) {}

  createStripeCheckout(user: User) {
    return this.stripeBillingService.createCheckoutSession(user);
  }

  createPaypalSubscription(user: User) {
    return this.paypalBillingService.createSubscription(user);
  }
}
