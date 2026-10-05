import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { WithLocaleDto } from './locale.dto';

export class RegisterDto extends WithLocaleDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
