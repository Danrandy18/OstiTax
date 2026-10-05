import { IsString } from 'class-validator';
import { WithLocaleDto } from './locale.dto';

export class GoogleLoginDto extends WithLocaleDto {
  @IsString()
  idToken!: string;
}
