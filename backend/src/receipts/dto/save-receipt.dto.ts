import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { ReceiptCategory, VatRate } from '../receipt-parser';

export const RECEIPT_CATEGORIES: readonly ReceiptCategory[] = [
  'workEquipment',
  'training',
  'travel',
  'homeServices',
  'other',
];

export const RECEIPT_VAT_RATES: readonly VatRate[] = [20, 13, 10, 0];

/** Datos que el usuario confirmo en la pantalla de revision. */
export class SaveReceiptDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  merchant?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  date?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  total?: number | null;

  @IsOptional()
  @IsIn(RECEIPT_VAT_RATES)
  vatRate?: VatRate | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  vatAmount?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentNumber?: string;

  @IsIn(RECEIPT_CATEGORIES)
  category!: ReceiptCategory;
}

/** Subida en bloque de los recibos que la web guardo antes en el navegador. */
export class ImportReceiptsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SaveReceiptDto)
  receipts!: SaveReceiptDto[];
}
