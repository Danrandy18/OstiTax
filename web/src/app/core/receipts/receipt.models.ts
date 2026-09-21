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

/** Recibo guardado en este dispositivo (Fase 1: nunca se sube la imagen ni el texto). */
export interface StoredReceipt {
  id: string;
  createdAt: string;
  merchant: string;
  date: string;
  total: number | null;
  vatRate: ReceiptVatRate | null;
  vatAmount: number | null;
  documentNumber: string;
  category: ReceiptCategory;
  depreciation: boolean;
  /** Miniatura JPEG pequena (data URL) para reconocer el recibo en la lista. */
  thumbnail: string | null;
}

export const RECEIPT_CATEGORIES: ReceiptCategory[] = [
  'workEquipment',
  'training',
  'travel',
  'homeServices',
  'other',
];

export const RECEIPT_VAT_RATES: ReceiptVatRate[] = [20, 13, 10, 0];
