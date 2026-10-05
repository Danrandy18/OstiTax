import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { ParsedReceipt, Receipt, ReceiptExportFormat, ReceiptInput } from './receipt.models';

@Injectable({ providedIn: 'root' })
export class ReceiptsApiService {
  private readonly http = inject(HttpClient);

  /** Envia solo el texto leido por el OCR (nunca la imagen). Requiere cuenta Pro. */
  parse(text: string): Observable<ParsedReceipt> {
    return this.http.post<ParsedReceipt>('/api/receipts/parse', { text });
  }

  list(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>('/api/receipts');
  }

  create(input: ReceiptInput): Observable<Receipt> {
    return this.http.post<Receipt>('/api/receipts', input);
  }

  import(receipts: ReceiptInput[]): Observable<{ imported: number }> {
    return this.http.post<{ imported: number }>('/api/receipts/import', { receipts });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/receipts/${encodeURIComponent(id)}`);
  }

  removeAll(): Observable<void> {
    return this.http.delete<void>('/api/receipts');
  }

  /** PDF (siempre en aleman) o CSV generados por el backend. */
  export(format: ReceiptExportFormat, year: number | null): Observable<Blob> {
    const params: Record<string, string> = { format };
    if (year) params['year'] = String(year);
    return this.http.get('/api/receipts/export', { params, responseType: 'blob' });
  }
}
