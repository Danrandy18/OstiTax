import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../../auth/accounts.service';
import type { Account } from '../../auth/entities/account.entity';
import { SubscriptionProvider } from '../../users/enums/user-plan.enum';
import { PlanInterval } from '../enums/plan-interval.enum';

interface PayPalAccessTokenResponse {
  access_token: string;
}

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  links: PayPalLink[];
}

interface PayPalSubscriptionDetails {
  id: string;
  status: string;
  custom_id?: string;
  billing_info?: {
    next_billing_time?: string;
  };
}

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id?: string;
    status?: string;
    custom_id?: string;
    billing_info?: {
      next_billing_time?: string;
    };
  };
}

@Injectable()
export class PaypalBillingService {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountsService: AccountsService,
  ) {}

  async createSubscription(
    account: Account,
    interval: PlanInterval,
  ): Promise<{ approvalUrl: string; subscriptionId: string }> {
    const planIds = this.configService.get<Record<string, string>>(
      'billing.paypal.planIds',
    );
    const appUrl = this.configService.get<string>('billing.appUrl');
    const planId = planIds?.[interval];

    if (!planId || !appUrl) {
      throw new ServiceUnavailableException(
        'PayPal plan or app URL is not configured',
      );
    }

    const subscription = await this.request<PayPalSubscriptionResponse>(
      '/v1/billing/subscriptions',
      {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          custom_id: account.id,
          application_context: {
            brand_name: 'ÖstiTax',
            locale: 'de-AT',
            user_action: 'SUBSCRIBE_NOW',
            return_url: `${appUrl}/payment/success?provider=paypal`,
            cancel_url: `${appUrl}/payment/cancel`,
          },
        }),
      },
    );

    const approvalUrl = subscription.links.find(
      (link) => link.rel === 'approve',
    )?.href;

    if (!approvalUrl) {
      throw new BadRequestException('PayPal subscription has no approval URL');
    }

    return { approvalUrl, subscriptionId: subscription.id };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.request<void>(
        `/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: 'Account deleted by user' }),
        },
      );
    } catch {
      // Ya cancelada o inexistente: no bloquear el borrado de la cuenta.
    }
  }

  async verifyWebhook(
    headers: Record<string, string | undefined>,
    body: unknown,
  ): Promise<boolean> {
    const webhookId = this.configService.get<string>('billing.paypal.webhookId');
    if (!webhookId) {
      throw new ServiceUnavailableException(
        'PayPal webhook ID is not configured',
      );
    }

    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionSig = headers['paypal-transmission-sig'];

    if (
      !transmissionId ||
      !transmissionTime ||
      !certUrl ||
      !authAlgo ||
      !transmissionSig
    ) {
      return false;
    }

    const result = await this.request<{ verification_status: string }>(
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: body,
        }),
      },
    );

    return result.verification_status === 'SUCCESS';
  }

  async handleWebhookEvent(event: PayPalWebhookEvent): Promise<void> {
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await this.handleSubscriptionActivated(event.resource);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await this.handleSubscriptionEnded(event.resource);
        break;
      default:
        break;
    }
  }

  private async handleSubscriptionActivated(
    resource: PayPalWebhookEvent['resource'],
  ): Promise<void> {
    if (!resource.id) {
      return;
    }

    const subscription = await this.getSubscription(resource.id);
    const accountId = subscription.custom_id;
    if (!accountId) {
      return;
    }

    await this.accountsService.activatePro(accountId, {
      provider: SubscriptionProvider.PAYPAL,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : null,
    });
  }

  private async handleSubscriptionEnded(
    resource: PayPalWebhookEvent['resource'],
  ): Promise<void> {
    if (!resource.id) {
      return;
    }

    const account = await this.accountsService.findByPaypalSubscriptionId(
      resource.id,
    );
    if (!account) {
      return;
    }

    await this.accountsService.downgradeToFree(account.id);
  }

  private async getSubscription(
    subscriptionId: string,
  ): Promise<PayPalSubscriptionDetails> {
    return this.request<PayPalSubscriptionDetails>(
      `/v1/billing/subscriptions/${subscriptionId}`,
      { method: 'GET' },
    );
  }

  private async request<T>(
    path: string,
    init: { method: string; body?: string },
  ): Promise<T> {
    const apiBase = this.configService.get<string>('billing.paypal.apiBase');
    if (!apiBase) {
      throw new ServiceUnavailableException('PayPal API base is not configured');
    }

    const token = await this.getAccessToken();
    const response = await fetch(`${apiBase}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadRequestException(
        `PayPal API error (${response.status}): ${errorBody}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('billing.paypal.clientId');
    const clientSecret = this.configService.get<string>(
      'billing.paypal.clientSecret',
    );
    const apiBase = this.configService.get<string>('billing.paypal.apiBase');

    if (!clientId || !clientSecret || !apiBase) {
      throw new ServiceUnavailableException('PayPal credentials are not configured');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadRequestException(
        `PayPal OAuth error (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as PayPalAccessTokenResponse & {
      expires_in?: number;
    };

    this.accessToken = data.access_token;
    this.accessTokenExpiresAt =
      Date.now() + ((data.expires_in ?? 3600) - 60) * 1000;

    return this.accessToken;
  }
}
