import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Casa de 2 habitaciones' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'Quiero una vivienda de 60m2 con sala, cocina, 2 cuartos y 1 baño' })
  @IsString()
  @MinLength(10)
  userDescription!: string;

  @ApiProperty({ required: false, description: 'UUID del usuario (opcional en modo híbrido)' })
  @IsOptional()
  @IsString()
  userId?: string;
}
