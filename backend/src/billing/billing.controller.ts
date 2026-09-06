import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccountsService } from '../auth/accounts.service';
import { AccountStatusDto } from '../auth/dto/account-status.dto';
import { CurrentAccount } from '../auth/decorators/current-account.decorator';
import type { Account } from '../auth/entities/account.entity';
import { AccountAuthGuard } from '../auth/guards/account-auth.guard';
import { BillingService } from './billing.service';
import { CreatePaypalSubscriptionDto } from './dto/create-paypal-subscription.dto';
import { CreateStripeCheckoutDto } from './dto/create-stripe-checkout.dto';

@Controller('billing')
@UseGuards(AccountAuthGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly accountsService: AccountsService,
  ) {}

  @Get('status')
  getStatus(@CurrentAccount() account: Account): AccountStatusDto {
    return AccountStatusDto.fromEntity(
      account,
      this.accountsService.isPro(account),
    );
  }

  @Post('stripe/checkout')
  createStripeCheckout(
    @CurrentAccount() account: Account,
    @Body() dto: CreateStripeCheckoutDto,
  ) {
    return this.billingService.createStripeCheckout(account, dto.interval);
  }

  @Post('paypal/subscription')
  createPaypalSubscription(
    @CurrentAccount() account: Account,
    @Body() dto: CreatePaypalSubscriptionDto,
  ) {
    return this.billingService.createPaypalSubscription(account, dto.interval);
  }
}
