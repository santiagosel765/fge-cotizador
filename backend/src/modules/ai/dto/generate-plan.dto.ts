import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GeneratePlanDto {
  @ApiProperty()
  @IsString()
  projectId!: string;
}
