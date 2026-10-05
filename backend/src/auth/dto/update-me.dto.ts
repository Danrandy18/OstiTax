import { IsIn } from 'class-validator';
import { MAIL_LOCALES } from '../mail/mail-i18n';

export class UpdateMeDto {
  @IsIn(MAIL_LOCALES)
  locale!: string;
}
