import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaypalBillingService } from '../paypal/paypal-billing.service';

@Controller('webhooks/paypal')
export class PaypalWebhookController {
  constructor(private readonly paypalBillingService: PaypalBillingService) {}

  @Post()
  async handleWebhook(
    @Req() request: Request,
    @Headers('paypal-transmission-id') transmissionId?: string,
    @Headers('paypal-transmission-time') transmissionTime?: string,
    @Headers('paypal-cert-url') certUrl?: string,
    @Headers('paypal-auth-algo') authAlgo?: string,
    @Headers('paypal-transmission-sig') transmissionSig?: string,
  ): Promise<{ received: true }> {
    const body = request.body;
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid webhook body');
    }

    const verified = await this.paypalBillingService.verifyWebhook(
      {
        'paypal-transmission-id': transmissionId,
        'paypal-transmission-time': transmissionTime,
        'paypal-cert-url': certUrl,
        'paypal-auth-algo': authAlgo,
        'paypal-transmission-sig': transmissionSig,
      },
      body,
    );

    if (!verified) {
      throw new BadRequestException('Invalid PayPal webhook signature');
    }

    await this.paypalBillingService.handleWebhookEvent(
      body as Parameters<PaypalBillingService['handleWebhookEvent']>[0],
    );

    return { received: true };
  }
}
