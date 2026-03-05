import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class CreateQuotationItemDto {
  @ApiProperty()
  @IsString()
  materialId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPriceGtq!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class LaborConfigDto {
  @ApiProperty({ required: false, example: 'economica' })
  @IsOptional()
  @IsString()
  projectType?: string;

  @ApiProperty({ required: false, example: 35, description: 'Porcentaje en escala 0-100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  customPercentage?: number;
}

export class CreateQuotationDto {
  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiProperty({ type: [CreateQuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items!: CreateQuotationItemDto[];

  @ApiProperty({
    required: false,
    type: Object,
    example: { projectType: 'economica', customPercentage: 35 },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LaborConfigDto)
  laborConfig?: LaborConfigDto;
}
