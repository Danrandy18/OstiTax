import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { AccountsService } from '../auth/accounts.service';
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
    private readonly accountsService: AccountsService,
  ) {}

  createStripeCheckout(account: Account, interval: PlanInterval) {
    this.assertNotAlreadySubscribed(account);
    return this.stripeBillingService.createCheckoutSession(account, interval);
  }

  createPaypalSubscription(account: Account, interval: PlanInterval) {
    this.assertNotAlreadySubscribed(account);
    return this.paypalBillingService.createSubscription(account, interval);
  }

  /** Evita crear una segunda suscripcion (y por tanto un segundo cobro recurrente) mientras ya hay una activa. */
  private assertNotAlreadySubscribed(account: Account): void {
    if (this.accountsService.isPro(account)) {
      throw new ConflictException(
        'This account already has an active subscription',
      );
    }
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

  /**
   * Cancelacion desde el perfil. Stripe: Pro sigue hasta el final del periodo pagado y no se
   * renueva (el correo de confirmacion lo envia el webhook). PayPal: la suscripcion termina al
   * cancelarla.
   */
  async cancelSubscription(account: Account): Promise<void> {
    if (!this.accountsService.isPro(account)) {
      throw new BadRequestException({
        code: 'NO_ACTIVE_SUBSCRIPTION',
        message: 'There is no active subscription to cancel.',
      });
    }
    if (
      account.subscriptionProvider === SubscriptionProvider.STRIPE &&
      account.stripeSubscriptionId
    ) {
      await this.stripeBillingService.scheduleCancellation(
        account.stripeSubscriptionId,
      );
      await this.accountsService.setCancelAtPeriodEnd(account.id, true);
      account.subscriptionCancelAtPeriodEnd = true;
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

  /** Reactiva una cancelacion programada (solo Stripe, antes de que acabe el periodo). */
  async resumeSubscription(account: Account): Promise<void> {
    if (
      !this.accountsService.isPro(account) ||
      !account.subscriptionCancelAtPeriodEnd ||
      account.subscriptionProvider !== SubscriptionProvider.STRIPE ||
      !account.stripeSubscriptionId
    ) {
      throw new BadRequestException({
        code: 'NOTHING_TO_RESUME',
        message: 'There is no scheduled cancellation to undo.',
      });
    }
    await this.stripeBillingService.resumeSubscription(
      account.stripeSubscriptionId,
    );
    await this.accountsService.setCancelAtPeriodEnd(account.id, false);
    account.subscriptionCancelAtPeriodEnd = false;
  }
}
