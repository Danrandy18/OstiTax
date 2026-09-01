import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PlanInterval,
  PaypalSubscriptionResponse,
  StripeCheckoutResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly http = inject(HttpClient);

  createStripeCheckout(
    interval: PlanInterval,
  ): Observable<StripeCheckoutResponse> {
    return this.http.post<StripeCheckoutResponse>(
      '/api/billing/stripe/checkout',
      { interval },
    );
  }

  createPaypalSubscription(
    interval: PlanInterval,
  ): Observable<PaypalSubscriptionResponse> {
    return this.http.post<PaypalSubscriptionResponse>(
      '/api/billing/paypal/subscription',
      { interval },
    );
  }
}
