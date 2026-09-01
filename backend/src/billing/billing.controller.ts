import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DeviceUserGuard } from '../common/guards/device-user.guard';
import type { User } from '../users/entities/user.entity';
import { UserStatusDto } from '../users/dto/user-status.dto';
import { UsersService } from '../users/users.service';
import { BillingService } from './billing.service';
import { CreatePaypalSubscriptionDto } from './dto/create-paypal-subscription.dto';
import { CreateStripeCheckoutDto } from './dto/create-stripe-checkout.dto';

@Controller('billing')
@UseGuards(DeviceUserGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly usersService: UsersService,
  ) {}

  @Get('status')
  getStatus(@CurrentUser() user: User): UserStatusDto {
    return UserStatusDto.fromEntity(user, this.usersService.isPro(user));
  }

  @Post('stripe/checkout')
  createStripeCheckout(
    @CurrentUser() user: User,
    @Body() dto: CreateStripeCheckoutDto,
  ) {
    return this.billingService.createStripeCheckout(user, dto.interval);
  }

  @Post('paypal/subscription')
  createPaypalSubscription(
    @CurrentUser() user: User,
    @Body() dto: CreatePaypalSubscriptionDto,
  ) {
    return this.billingService.createPaypalSubscription(user, dto.interval);
  }
}
