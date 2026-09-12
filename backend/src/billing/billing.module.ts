import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { PaypalBillingService } from './paypal/paypal-billing.service';
import { StripeBillingService } from './stripe/stripe-billing.service';
import { PaypalWebhookController } from './webhooks/paypal-webhook.controller';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';
import { WebhookEventsService } from './webhooks/webhook-events.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([ProcessedWebhookEvent]),
  ],
  controllers: [
    BillingController,
    StripeWebhookController,
    PaypalWebhookController,
  ],
  providers: [
    BillingService,
    StripeBillingService,
    PaypalBillingService,
    WebhookEventsService,
  ],
  exports: [BillingService],
})
export class BillingModule {}
