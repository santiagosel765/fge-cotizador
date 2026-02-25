import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GenerateAssetDto {
  @ApiProperty()
  @IsString()
  projectId!: string;
}
