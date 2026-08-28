import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaypalBillingService } from './paypal/paypal-billing.service';
import { StripeBillingService } from './stripe/stripe-billing.service';
import { PaypalWebhookController } from './webhooks/paypal-webhook.controller';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';

@Module({
  imports: [UsersModule],
  controllers: [
    BillingController,
    StripeWebhookController,
    PaypalWebhookController,
  ],
  providers: [BillingService, StripeBillingService, PaypalBillingService],
})
export class BillingModule {}
