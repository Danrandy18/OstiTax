import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { AccountsService } from '../../auth/accounts.service';
import type { Account } from '../../auth/entities/account.entity';
import { SubscriptionProvider } from '../../users/enums/user-plan.enum';
import { PlanInterval } from '../enums/plan-interval.enum';
import { WebhookEventsService } from '../webhooks/webhook-events.service';

@Injectable()
export class StripeBillingService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountsService: AccountsService,
    private readonly webhookEventsService: WebhookEventsService,
  ) {}

  private getStripe(): Stripe {
    if (this.stripe) {
      return this.stripe;
    }

    const secretKey = this.configService.get<string>('billing.stripe.secretKey');
    if (!secretKey) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }

    this.stripe = new Stripe(secretKey);
    return this.stripe;
  }

  async createCheckoutSession(
    account: Account,
    interval: PlanInterval,
  ): Promise<{ url: string; sessionId: string }> {
    const priceIds = this.configService.get<Record<string, string>>(
      'billing.stripe.priceIds',
    );
    const appUrl = this.configService.get<string>('billing.appUrl');
    const priceId = priceIds?.[interval];

    if (!priceId || !appUrl) {
      throw new ServiceUnavailableException(
        'Stripe price or app URL is not configured',
      );
    }

    const stripe = this.getStripe();
    let customerId = account.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: account.email,
        metadata: {
          accountId: account.id,
        },
      });
      customerId = customer.id;
      await this.accountsService.setStripeCustomerId(account.id, customerId);
    }

    // Idempotency key acotada al dia: si el cliente reintenta (doble click, conexion
    // caida) Stripe devuelve la misma session en vez de crear una nueva.
    const today = new Date().toISOString().slice(0, 10);
    const idempotencyKey = `checkout:${account.id}:${interval}:${today}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/payment/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/payment/cancel`,
        client_reference_id: account.id,
        metadata: { accountId: account.id },
        subscription_data: {
          metadata: { accountId: account.id },
        },
      },
      { idempotencyKey },
    );

    if (!session.url) {
      throw new BadRequestException('Stripe checkout session has no URL');
    }

    return { url: session.url, sessionId: session.id };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.getStripe().subscriptions.cancel(subscriptionId);
    } catch {
      // Ya cancelada o inexistente: no bloquear el borrado de la cuenta.
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'billing.stripe.webhookSecret',
    );

    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Stripe webhook secret is not configured',
      );
    }

    return this.getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const isNewEvent = await this.webhookEventsService.markProcessedIfNew(
      SubscriptionProvider.STRIPE,
      event.id,
    );
    if (!isNewEvent) {
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
  }

  private getSubscriptionPeriodEnd(
    subscription: Stripe.Subscription,
  ): Date | null {
    const firstItem = subscription.items?.data?.[0];
    return this.toDate(firstItem?.current_period_end);
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const accountId = session.metadata?.accountId ?? session.client_reference_id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!accountId || !subscriptionId) {
      return;
    }

    const stripe = this.getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await this.accountsService.activatePro(accountId, {
      provider: SubscriptionProvider.STRIPE,
      subscriptionId,
      status: subscription.status,
      currentPeriodEnd: this.getSubscriptionPeriodEnd(subscription),
      stripeCustomerId:
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null,
    });
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const account =
      (await this.accountsService.findByStripeSubscriptionId(
        subscription.id,
      )) ??
      (subscription.metadata.accountId
        ? await this.accountsService.findById(subscription.metadata.accountId)
        : null);

    if (!account) {
      return;
    }

    const activeStatuses = new Set(['active', 'trialing', 'past_due']);
    if (activeStatuses.has(subscription.status)) {
      await this.accountsService.activatePro(account.id, {
        provider: SubscriptionProvider.STRIPE,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: this.getSubscriptionPeriodEnd(subscription),
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id ?? account.stripeCustomerId,
      });
      return;
    }

    await this.accountsService.updateSubscriptionStatus(
      account.id,
      subscription.status,
      this.getSubscriptionPeriodEnd(subscription),
    );
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const account = await this.accountsService.findByStripeSubscriptionId(
      subscription.id,
    );
    if (!account) {
      return;
    }

    await this.accountsService.downgradeToFree(account.id);
  }

  private toDate(unixSeconds: number | null | undefined): Date | null {
    if (!unixSeconds) {
      return null;
    }
    return new Date(unixSeconds * 1000);
  }
}
