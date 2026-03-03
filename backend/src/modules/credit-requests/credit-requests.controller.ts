import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { CreditRequestsService } from './credit-requests.service';

@ApiTags('Credit Requests')
@Controller('credit-requests')
export class CreditRequestsController {
  constructor(private readonly service: CreditRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear solicitud de crédito' })
  create(
    @Body() dto: CreateCreditRequestDto,
    @CurrentUser() user?: { userId?: string; id?: string },
  ) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes de crédito' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@Query('projectId') projectId?: string) {
    return this.service.findAll(projectId);
  }
}
