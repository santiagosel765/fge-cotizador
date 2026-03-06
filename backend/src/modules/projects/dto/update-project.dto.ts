import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsString()
  plannerProjectType?: string;

  @IsOptional()
  @IsString()
  plannerDimensions?: string;

  @IsOptional()
  @IsString()
  plannerMainSpaces?: string;

  @IsOptional()
  @IsString()
  plannerKeyMaterials?: string;
}
