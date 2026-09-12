import { IsNotEmpty, IsString } from 'class-validator';

export class StartLinkDto {
  @IsString()
  @IsNotEmpty()
  institutionId!: string;
}
