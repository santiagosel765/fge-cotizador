import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('Quotations')
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cotización con items' })
  create(@Body() dto: CreateQuotationDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener cotizaciones por proyecto' })
  @ApiQuery({ name: 'projectId', required: false })
  findByProject(@Query('projectId') projectId?: string) {
    if (projectId) return this.service.findByProject(projectId);
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cotización por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
