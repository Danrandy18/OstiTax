import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { User } from '../../users/entities/user.entity';
import { SubscriptionProvider } from '../../users/enums/user-plan.enum';
import { UsersService } from '../../users/users.service';

@Injectable()
export class StripeBillingService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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
    user: User,
  ): Promise<{ url: string; sessionId: string }> {
    const priceId = this.configService.get<string>('billing.stripe.priceId');
    const appUrl = this.configService.get<string>('billing.appUrl');

    if (!priceId || !appUrl) {
      throw new ServiceUnavailableException(
        'Stripe price or app URL is not configured',
      );
    }

    const stripe = this.getStripe();
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          userId: user.id,
          deviceId: user.deviceId,
        },
      });
      customerId = customer.id;
      await this.usersService.setStripeCustomerId(user.id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/payment/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
      },
    });

    if (!session.url) {
      throw new BadRequestException('Stripe checkout session has no URL');
    }

    return { url: session.url, sessionId: session.id };
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
    const userId = session.metadata?.userId ?? session.client_reference_id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!userId || !subscriptionId) {
      return;
    }

    const stripe = this.getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await this.usersService.activatePro(userId, {
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
    const user =
      (await this.usersService.findByStripeSubscriptionId(subscription.id)) ??
      (subscription.metadata.userId
        ? await this.usersService.findById(subscription.metadata.userId)
        : null);

    if (!user) {
      return;
    }

    const activeStatuses = new Set(['active', 'trialing', 'past_due']);
    if (activeStatuses.has(subscription.status)) {
      await this.usersService.activatePro(user.id, {
        provider: SubscriptionProvider.STRIPE,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: this.getSubscriptionPeriodEnd(subscription),
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id ?? user.stripeCustomerId,
      });
      return;
    }

    await this.usersService.updateSubscriptionStatus(
      user.id,
      subscription.status,
      this.getSubscriptionPeriodEnd(subscription),
    );
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const user = await this.usersService.findByStripeSubscriptionId(
      subscription.id,
    );
    if (!user) {
      return;
    }

    await this.usersService.downgradeToFree(user.id);
  }

  private toDate(unixSeconds: number | null | undefined): Date | null {
    if (!unixSeconds) {
      return null;
    }
    return new Date(unixSeconds * 1000);
  }
}
