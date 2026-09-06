import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaypalBillingService } from './paypal/paypal-billing.service';
import { StripeBillingService } from './stripe/stripe-billing.service';
import { PaypalWebhookController } from './webhooks/paypal-webhook.controller';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    BillingController,
    StripeWebhookController,
    PaypalWebhookController,
  ],
  providers: [BillingService, StripeBillingService, PaypalBillingService],
  exports: [BillingService],
})
export class BillingModule {}
