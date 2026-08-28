import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  deviceId?: string;
}
