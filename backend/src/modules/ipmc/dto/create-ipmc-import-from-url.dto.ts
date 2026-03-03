import { IsInt, IsUrl, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIpMcImportFromUrlDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsUrl({ require_protocol: true })
  pdfUrl!: string;
}
