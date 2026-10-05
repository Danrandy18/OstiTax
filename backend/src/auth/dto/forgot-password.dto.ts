import { IsEmail } from 'class-validator';
import { WithLocaleDto } from './locale.dto';

export class ForgotPasswordDto extends WithLocaleDto {
  @IsEmail()
  email!: string;
}
