import { Controller, Get } from '@nestjs/common';
import { CreditRequestsService } from './credit-requests.service';

@Controller('credit-requests')
export class CreditRequestsController {
  constructor(private readonly service: CreditRequestsService) {}

  @Get()
  findAll(): string {
    // TODO: implementar
    return this.service.findAll();
  }
}
