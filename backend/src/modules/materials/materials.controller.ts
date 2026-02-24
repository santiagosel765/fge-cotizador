import { Controller, Get } from '@nestjs/common';
import { MaterialsService } from './materials.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  @Get()
  findAll(): string {
    // TODO: implementar
    return this.service.findAll();
  }
}
