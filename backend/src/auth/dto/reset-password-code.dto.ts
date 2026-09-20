import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordWithCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
