import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Get()
  findAll(): string {
    // TODO: implementar
    return this.service.findAll();
  }
}
