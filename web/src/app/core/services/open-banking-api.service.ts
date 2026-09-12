import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  BankConnection,
  BankInstitution,
  BankTransaction,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class OpenBankingApiService {
  private readonly http = inject(HttpClient);

  listInstitutions(): Observable<BankInstitution[]> {
    return this.http.get<BankInstitution[]>('/api/open-banking/institutions');
  }

  startLink(institutionId: string): Observable<{ redirectUrl: string }> {
    return this.http.post<{ redirectUrl: string }>('/api/open-banking/link', {
      institutionId,
    });
  }

  completeLink(
    ref: string,
  ): Observable<{ status: string; connectionId: string }> {
    return this.http.get<{ status: string; connectionId: string }>(
      `/api/open-banking/callback?ref=${encodeURIComponent(ref)}`,
    );
  }

  syncTransactions(connectionId: string): Observable<{ imported: number }> {
    return this.http.post<{ imported: number }>(
      `/api/open-banking/connections/${connectionId}/sync`,
      {},
    );
  }

  listConnections(): Observable<BankConnection[]> {
    return this.http.get<BankConnection[]>('/api/open-banking/connections');
  }

  listTransactions(connectionId?: string): Observable<BankTransaction[]> {
    const query = connectionId
      ? `?connectionId=${encodeURIComponent(connectionId)}`
      : '';
    return this.http.get<BankTransaction[]>(
      `/api/open-banking/transactions${query}`,
    );
  }
}
