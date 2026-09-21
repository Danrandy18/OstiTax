import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { ParsedReceipt } from './receipt.models';

@Injectable({ providedIn: 'root' })
export class ReceiptsApiService {
  private readonly http = inject(HttpClient);

  /** Envia solo el texto leido por el OCR (nunca la imagen). Requiere cuenta Pro. */
  parse(text: string): Observable<ParsedReceipt> {
    return this.http.post<ParsedReceipt>('/api/receipts/parse', { text });
  }
}
