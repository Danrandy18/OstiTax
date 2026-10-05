export type ReceiptCategory = 'workEquipment' | 'training' | 'travel' | 'homeServices' | 'other';
export type ReceiptVatRate = 0 | 10 | 13 | 20;

export interface ReceiptField<T> {
  value: T | null;
  evidence: string | null;
}

/** Respuesta de POST /api/receipts/parse (el backend es la unica fuente de la categorizacion). */
export interface ParsedReceipt {
  merchant: ReceiptField<string>;
  date: ReceiptField<string>;
  total: ReceiptField<number>;
  vat: {
    rate: ReceiptVatRate | null;
    amount: number | null;
    net: number | null;
    rates: ReceiptVatRate[];
    evidence: string | null;
  };
  documentNumber: ReceiptField<string>;
  category: ReceiptCategory;
  categoryEvidence: string[];
  depreciation: boolean;
  gwgLimit: number;
  warnings: string[];
}

/** Datos que el usuario confirma en la pantalla de revision (POST /api/receipts). */
export interface ReceiptInput {
  merchant: string;
  date: string | null;
  total: number | null;
  vatRate: ReceiptVatRate | null;
  vatAmount: number | null;
  documentNumber: string;
  category: ReceiptCategory;
}

/**
 * Recibo guardado en la cuenta (visible en web y app). Ni la imagen ni el texto del OCR salen
 * del dispositivo; `depreciation` lo decide el backend.
 */
export interface Receipt extends ReceiptInput {
  id: string;
  createdAt: string;
  depreciation: boolean;
}

/** Formato antiguo (Fase 1): recibos guardados solo en el navegador. */
export interface LegacyStoredReceipt extends ReceiptInput {
  id: string;
  createdAt: string;
  depreciation: boolean;
  thumbnail: string | null;
}

export type ReceiptExportFormat = 'pdf' | 'csv';

export const RECEIPT_CATEGORIES: ReceiptCategory[] = [
  'workEquipment',
  'training',
  'travel',
  'homeServices',
  'other',
];

export const RECEIPT_VAT_RATES: ReceiptVatRate[] = [20, 13, 10, 0];
