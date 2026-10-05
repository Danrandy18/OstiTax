import { IsEmail, IsString } from 'class-validator';
import { WithLocaleDto } from './locale.dto';

export class LoginDto extends WithLocaleDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
