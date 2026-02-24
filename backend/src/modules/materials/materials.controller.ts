import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialCategoryDto } from './dto/create-material-category.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  // ─── CATEGORÍAS ───────────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas las categorías con sus materiales' })
  findAllCategories() {
    return this.service.findAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Crear categoría de material' })
  createCategory(@Body() dto: CreateMaterialCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Get('categories/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  findOneCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneCategory(id);
  }

  // ─── MATERIALES ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar materiales activos (opcionalmente filtrar por categoría)' })
  @ApiQuery({ name: 'category', required: false, description: 'Código de categoría: obra_gris, plomeria_tuberia, etc.' })
  findAll(@Query('category') category?: string) {
    return this.service.findAll(category);
  }

  @Post()
  @ApiOperation({ summary: 'Crear material' })
  create(@Body() dto: CreateMaterialDto) {
    return this.service.create(dto);
  }

  @Get('by-code/:legacyCode')
  @ApiOperation({ summary: 'Buscar material por legacyCode (ej: cem-01)' })
  findByLegacyCode(@Param('legacyCode') legacyCode: string) {
    return this.service.findByLegacyCode(legacyCode);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'Obtener material por UUID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'Actualizar material (precio, nombre, estado)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'Desactivar material (soft delete via isActive=false)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
