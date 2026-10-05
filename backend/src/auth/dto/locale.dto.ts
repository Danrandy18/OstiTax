import { IsIn, IsOptional } from 'class-validator';
import { MAIL_LOCALES } from '../mail/mail-i18n';

/** Idioma de la pagina en el momento de la accion: los correos se envian en ese idioma. */
export class WithLocaleDto {
  @IsOptional()
  @IsIn(MAIL_LOCALES)
  locale?: string;
}
