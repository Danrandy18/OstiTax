import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeBillingService } from '../stripe/stripe-billing.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeBillingService: StripeBillingService) {}

  @Post()
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    const event = this.stripeBillingService.constructWebhookEvent(
      request.rawBody,
      signature,
    );

    await this.stripeBillingService.handleWebhookEvent(event);
    return { received: true };
  }
}
