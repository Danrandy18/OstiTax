import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListReceiptsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

export class ExportReceiptsQueryDto extends ListReceiptsQueryDto {
  @IsOptional()
  @IsIn(['pdf', 'csv'])
  format: 'pdf' | 'csv' = 'pdf';
}
