import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ required: false, example: 'Zona 5, Ciudad de Guatemala' })
  @IsOptional()
  @IsString()
  addressText?: string;

  @ApiProperty({ required: false, example: 14.6349 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ required: false, example: -90.5069 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
