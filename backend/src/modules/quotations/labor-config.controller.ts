import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { LaborConfig } from './entities/labor-config.entity';
import { LaborConfigService } from './labor-config.service';

class UpdateLaborConfigDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  percentage?: number;
}

@ApiTags('Labor Configs')
@Controller('labor-configs')
export class LaborConfigController {
  constructor(private readonly laborConfigService: LaborConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Listar configuraciones de mano de obra' })
  findAll(): Promise<LaborConfig[]> {
    return this.laborConfigService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar label o porcentaje de configuración de mano de obra' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLaborConfigDto,
  ): Promise<LaborConfig> {
    return this.laborConfigService.update(id, dto);
  }
}
