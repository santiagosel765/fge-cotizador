import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateIpMcImportFromUrlDto } from './dto/create-ipmc-import-from-url.dto';
import { CreateIpMcImportDto } from './dto/create-ipmc-import.dto';
import { IpMcService } from './ipmc.service';

@ApiTags('IPMC')
@Controller('ipmc')
export class IpMcController {
  constructor(private readonly ipmcService: IpMcService) {}

  @Post('import')
  @ApiOperation({ summary: 'Importar IPMC desde PDF (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['year', 'month', 'pdf'],
      properties: {
        year: { type: 'number' },
        month: { type: 'number' },
        pdf: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('pdf'))
  async import(
    @UploadedFile() file: { mimetype: string; buffer: Buffer; originalname: string },
    @Body() dto: CreateIpMcImportDto,
  ) {
    if (!file) throw new BadRequestException('Debe enviar un archivo PDF');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('El archivo debe ser application/pdf');
    }

    return this.ipmcService.importFromPdf(file.buffer, {
      year: dto.year,
      month: dto.month,
      source: dto.source || 'INE',
      originalFilename: file.originalname,
    });
  }

  @Post('import-from-url')
  @ApiOperation({ summary: 'Importar IPMC desde URL de PDF' })
  importFromUrl(@Body() dto: CreateIpMcImportFromUrlDto) {
    return this.ipmcService.importFromUrl(dto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Listar reportes IPMC importados' })
  getReports() {
    return this.ipmcService.getReports();
  }

  @Get('reports/latest')
  @ApiOperation({ summary: 'Obtener el último reporte IPMC importado' })
  getLatestReport() {
    return this.ipmcService.getLatestReport();
  }

  @Get('reports/:id/items')
  @ApiOperation({ summary: 'Listar items de un reporte IPMC' })
  getReportItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.ipmcService.getReportItems(id);
  }
}
