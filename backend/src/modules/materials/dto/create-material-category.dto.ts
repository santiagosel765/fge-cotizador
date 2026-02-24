import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialCategoryDto {
  @ApiProperty({ example: 'obra_gris' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Obra Gris' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
