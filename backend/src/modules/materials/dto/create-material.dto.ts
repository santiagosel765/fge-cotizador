import { IsString, IsNumber, IsBoolean, IsOptional, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ example: 'cem-01' })
  @IsString()
  legacyCode!: string;

  @ApiProperty({ description: 'UUID de la categoría' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: 'Bolsa de Cemento UGC 3000 PSI' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Bolsa 42.5kg' })
  @IsString()
  unit!: string;

  @ApiProperty({ example: 85.00 })
  @IsNumber()
  @IsPositive()
  unitPriceGtq!: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
