import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
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


  @Post('technical-plan/:projectId/:planType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar plano técnico adicional (acotado/electrico/fuerza/hidraulico/drenajes/cimentaciones)' })
  generateTechnicalPlan(
    @Param('projectId') projectId: string,
    @Param('planType') planType: string,
  ) {
    const validTypes = ['acotado', 'electrico', 'fuerza', 'hidraulico', 'drenajes', 'cimentaciones'];
    if (!validTypes.includes(planType)) {
      throw new BadRequestException(`Tipo de plano inválido: ${planType}`);
    }
    return this.service.generateTechnicalPlan(projectId, planType as any);
  }

  @Post('render/:projectId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar render fotorrealista con gemini-2.0-flash-exp' })
  generateRender(@Param('projectId') projectId: string) {
    return this.service.generateRender(projectId);
  }

  @Post('panorama/:projectId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar panorama interior 360° con gemini-2.0-flash-exp' })
  generatePanorama(@Param('projectId') projectId: string) {
    return this.service.generatePanorama(projectId);
  }
}
