import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GoCardlessInstitution {
  id: string;
  name: string;
  bic?: string;
  logo?: string;
  transaction_total_days?: string;
}

export interface GoCardlessRequisition {
  id: string;
  status: string;
  accounts: string[];
  link?: string;
}

export interface GoCardlessAccountDetails {
  account?: {
    iban?: string;
    currency?: string;
    ownerName?: string;
    name?: string;
  };
}

export interface GoCardlessTransaction {
  transactionId?: string;
  bookingDate?: string;
  transactionAmount?: { amount: string; currency: string };
  remittanceInformationUnstructured?: string;
  creditorName?: string;
  debtorName?: string;
  [key: string]: unknown;
}

export interface GoCardlessTransactionsResponse {
  transactions: {
    booked: GoCardlessTransaction[];
    pending: GoCardlessTransaction[];
  };
}

/**
 * Cliente puro de la API de GoCardless Bank Account Data -- sin conocimiento
 * de Account/repositorios, toda la persistencia vive en OpenBankingService.
 * Mismo patron de token cacheado + request<T>() que PaypalBillingService
 * (backend/src/billing/paypal/paypal-billing.service.ts).
 */
@Injectable()
export class GoCardlessService {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {}

  async listInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    return this.request<GoCardlessInstitution[]>(
      `/institutions/?country=${country}`,
      { method: 'GET' },
    );
  }

  async createRequisition(params: {
    redirectUrl: string;
    institutionId: string;
    reference: string;
    language: string;
  }): Promise<GoCardlessRequisition> {
    return this.request<GoCardlessRequisition>('/requisitions/', {
      method: 'POST',
      body: JSON.stringify({
        redirect: params.redirectUrl,
        institution_id: params.institutionId,
        reference: params.reference,
        user_language: params.language,
      }),
    });
  }

  async getRequisition(requisitionId: string): Promise<GoCardlessRequisition> {
    return this.request<GoCardlessRequisition>(
      `/requisitions/${requisitionId}/`,
      { method: 'GET' },
    );
  }

  async getAccountDetails(
    externalAccountId: string,
  ): Promise<GoCardlessAccountDetails> {
    return this.request<GoCardlessAccountDetails>(
      `/accounts/${externalAccountId}/details/`,
      { method: 'GET' },
    );
  }

  async getAccountTransactions(
    externalAccountId: string,
  ): Promise<GoCardlessTransactionsResponse> {
    return this.request<GoCardlessTransactionsResponse>(
      `/accounts/${externalAccountId}/transactions/`,
      { method: 'GET' },
    );
  }

  private async request<T>(
    path: string,
    init: { method: string; body?: string },
  ): Promise<T> {
    const baseUrl = this.configService.get<string>('openBanking.baseUrl');
    const token = await this.getAccessToken();

    const response = await fetch(`${baseUrl}${path}`, {
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
        `GoCardless API error (${response.status}): ${errorBody}`,
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

    const enabled = this.configService.get<boolean>('openBanking.enabled');
    const secretId = this.configService.get<string>('openBanking.secretId');
    const secretKey = this.configService.get<string>('openBanking.secretKey');
    const baseUrl = this.configService.get<string>('openBanking.baseUrl');

    if (!enabled || !secretId || !secretKey || !baseUrl) {
      throw new ServiceUnavailableException(
        'GoCardless Bank Account Data is not configured',
      );
    }

    const response = await fetch(`${baseUrl}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadRequestException(
        `GoCardless OAuth error (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as {
      access: string;
      access_expires: number;
    };

    this.accessToken = data.access;
    this.accessTokenExpiresAt = Date.now() + (data.access_expires - 60) * 1000;

    return this.accessToken;
  }
}
