import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import type {
  CalculateRequest,
  CalculateResponse,
  PaymentRequiredError,
} from '../models/api.models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class CalculatorApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  calculate(request: CalculateRequest): Observable<CalculateResponse> {
    return this.http.post<CalculateResponse>('/api/calculate', request).pipe(
      tap((response) => {
        if (response.usage) {
          this.session.status.update((current) =>
            current
              ? {
                  ...current,
                  plan: response.usage!.plan,
                  freeAttemptsRemaining: response.usage!.freeAttemptsRemaining,
                  isPro: response.usage!.isPro,
                }
              : current,
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 402) {
          const body = error.error as PaymentRequiredError;
          this.session.status.update((current) =>
            current
              ? {
                  ...current,
                  freeAttemptsRemaining: body.freeAttemptsRemaining ?? 0,
                  plan: body.plan ?? 'free',
                  isPro: false,
                }
              : current,
          );
        }
        return throwError(() => error);
      }),
    );
  }
}

export function isPaymentRequiredError(
  error: unknown,
): error is HttpErrorResponse & { error: PaymentRequiredError } {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 402 &&
    error.error?.code === 'PAYMENT_REQUIRED'
  );
}
