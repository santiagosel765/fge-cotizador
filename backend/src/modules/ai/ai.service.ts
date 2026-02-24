import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialsService } from '../materials/materials.service';
import { ProjectsService } from '../projects/projects.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiAssetStatus, AiAssetType, AiGeneratedAsset } from './entities/ai-generated-asset.entity';

type PlanResponse = {
  detailedConcept: string;
  blueprintSvg: string;
  blueprintPrompt: string;
  renderPrompt: string;
  panoPrompt: string;
  suggestedMaterials: Array<{ legacyCode: string; quantity: number; reason: string }>;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    @InjectRepository(AiGeneratedAsset)
    private readonly assetsRepo: Repository<AiGeneratedAsset>,
    @InjectRepository(AiConversation)
    private readonly conversationsRepo: Repository<AiConversation>,
    private readonly projectsService: ProjectsService,
    private readonly materialsService: MaterialsService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY no está configurada en .env');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(dto: ChatMessageDto): Promise<{ reply: string }> {
    const project = await this.projectsService.findOne(dto.projectId);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemContext = `Eres un asistente experto en construcción de viviendas en Guatemala para Fundación Génesis Empresarial (FGE).
Ayudas a clientes a definir sus proyectos de construcción.
Proyecto actual: "${project.name}".
Descripción: "${project.userDescription}".
Responde en español, de forma amable y profesional.
Cuando el usuario haya definido bien su proyecto, sugiere usar el botón "Generar Plan Completo".`;

    const history = (dto.history ?? []).map((h) => ({
      role: (h.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({
      history,
      systemInstruction: systemContext,
    });

    let reply = '';
    try {
      const result = await chat.sendMessage(dto.message);
      reply = result.response.text();
    } catch (error) {
      this.logger.error(`Error en Gemini chat: ${String(error)}`);
      throw new Error('No se pudo obtener respuesta de IA. Intenta nuevamente.');
    }

    try {
      let conversation = await this.conversationsRepo.findOne({
        where: { projectId: dto.projectId },
      });
      if (!conversation) {
        conversation = this.conversationsRepo.create({
          projectId: dto.projectId,
          userId: this.ANONYMOUS_USER_ID,
        });
        await this.conversationsRepo.save(conversation);
      }
    } catch (error) {
      this.logger.warn(`No se pudo guardar conversación: ${String(error)}`);
    }

    return { reply };
  }

  async generatePlan(dto: GeneratePlanDto): Promise<{
    detailedConcept: string;
    blueprintSvg: string;
    suggestedMaterials: Array<{ legacyCode: string; quantity: number; reason: string }>;
  }> {
    const project = await this.projectsService.findOne(dto.projectId);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const categories = await this.materialsService.findAllCategories();
    const materialsList = categories
      .flatMap((c) => c.materials ?? [])
      .map((m) => `${m.legacyCode}: ${m.name} (${m.unit}) - Q${m.unitPriceGtq}`)
      .join('\n');

    const prompt = `Eres un arquitecto experto en construcción de viviendas económicas en Guatemala.

PROYECTO A PLANIFICAR:
Nombre: ${project.name}
Descripción: ${project.userDescription}

CATÁLOGO DE MATERIALES DISPONIBLES (solo usa estos):
${materialsList}

Genera una respuesta JSON con esta estructura exacta (sin markdown, solo JSON puro):
{
  "detailedConcept": "descripción técnica detallada del proyecto en 3-4 párrafos",
  "blueprintSvg": "<svg viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'>...plano arquitectónico 2D completo con habitaciones, medidas, etiquetas...</svg>",
  "blueprintPrompt": "descripción del plano para referencia futura",
  "renderPrompt": "prompt para generar imagen fotorrealista exterior de esta vivienda",
  "panoPrompt": "prompt para generar tour virtual 360° interior",
  "suggestedMaterials": [
    {
      "legacyCode": "cem-01",
      "quantity": 150,
      "reason": "para cimientos y paredes"
    }
  ]
}

INSTRUCCIONES PARA blueprintSvg:
- Crear un SVG válido de plano arquitectónico 2D visto desde arriba
- Incluir todas las habitaciones mencionadas en la descripción
- Dibujar paredes con rectángulos o líneas
- Etiquetar cada habitación con su nombre y metros cuadrados aproximados
- Incluir puertas (arco de 90°) y ventanas (líneas dobles)
- Usar colores: paredes #333, relleno habitaciones #f5f5f5, texto #222
- Incluir cotas/medidas externas
- El plano debe ser técnico pero comprensible

INSTRUCCIONES PARA suggestedMaterials:
- Solo usar legacyCodes del catálogo proporcionado
- Calcular cantidades realistas para el proyecto descrito
- Incluir al menos 10 materiales principales`;

    let text = '';
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (error) {
      this.logger.error(`Error en Gemini generatePlan: ${String(error)}`);
      throw new Error('No se pudo generar el plan con IA. Intenta nuevamente.');
    }

    let parsed: PlanResponse;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned) as PlanResponse;
    } catch {
      this.logger.error(`Error parseando respuesta de Gemini: ${text.substring(0, 500)}`);
      throw new Error('La IA no devolvió un formato válido. Intenta de nuevo.');
    }

    await this.projectsService.savePlan(dto.projectId, {
      detailedConcept: parsed.detailedConcept,
      blueprintPrompt: parsed.blueprintPrompt ?? '',
      renderPrompt: parsed.renderPrompt ?? '',
      panoPrompt: parsed.panoPrompt ?? '',
    });

    if (parsed.blueprintSvg) {
      try {
        const existing = await this.assetsRepo.findOne({
          where: { projectId: dto.projectId, assetType: AiAssetType.BLUEPRINT },
        });
        if (existing) {
          existing.storageUrl = parsed.blueprintSvg;
          existing.status = AiAssetStatus.READY;
          existing.prompt = parsed.blueprintPrompt ?? existing.prompt;
          existing.modelUsed = 'gemini-1.5-flash';
          await this.assetsRepo.save(existing);
        } else {
          const asset = this.assetsRepo.create({
            projectId: dto.projectId,
            assetType: AiAssetType.BLUEPRINT,
            storageUrl: parsed.blueprintSvg,
            status: AiAssetStatus.READY,
            prompt: parsed.blueprintPrompt ?? 'Blueprint generado por IA',
            modelUsed: 'gemini-1.5-flash',
          });
          await this.assetsRepo.save(asset);
        }
      } catch (error) {
        this.logger.warn(`No se pudo guardar blueprint asset: ${String(error)}`);
      }
    }

    return {
      detailedConcept: parsed.detailedConcept,
      blueprintSvg: parsed.blueprintSvg,
      suggestedMaterials: parsed.suggestedMaterials ?? [],
    };
  }
}
