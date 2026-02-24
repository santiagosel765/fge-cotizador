import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatMessageDto } from './dto/chat-message.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar mensaje al asistente IA' })
  chat(@Body() dto: ChatMessageDto) {
    return this.service.chat(dto);
  }

  @Post('plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar plan completo: concepto + plano SVG + materiales sugeridos' })
  generatePlan(@Body() dto: GeneratePlanDto) {
    return this.service.generatePlan(dto);
  }
}
