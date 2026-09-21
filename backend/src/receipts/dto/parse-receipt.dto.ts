import { IsString, MaxLength, MinLength } from 'class-validator';

export class ParseReceiptDto {
  /** Texto que leyo el OCR del cliente (la imagen no se envia). */
  @IsString()
  @MinLength(3)
  @MaxLength(20000)
  text!: string;
}
