import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
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
  private readonly genAINew: GoogleGenAI;
  private readonly ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

  private parseGeminiJson(rawText: string): any {
    const attempts: string[] = [];

    const tryParse = (candidate: string, label: string): any | null => {
      try {
        return JSON.parse(candidate);
      } catch {
        attempts.push(label);
        return null;
      }
    };

    const direct = tryParse(rawText, 'json directo');
    if (direct) return direct;

    const markdownMatch = rawText.match(/```json\s*([\s\S]*?)```/i)
      ?? rawText.match(/```\s*([\s\S]*?)```/);
    if (markdownMatch?.[1]) {
      const markdownParsed = tryParse(markdownMatch[1].trim(), 'bloque markdown');
      if (markdownParsed) return markdownParsed;
    }

    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const slicedParsed = tryParse(rawText.slice(start, end + 1), 'desde primera llave a última llave');
      if (slicedParsed) return slicedParsed;
    } else {
      attempts.push('desde primera llave a última llave');
    }

    const repairedText = rawText
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, '$1');
    const repaired = tryParse(repairedText, 'reparación básica');
    if (repaired) return repaired;

    const debugSnippet = rawText.slice(0, 200).replace(/\s+/g, ' ').trim();
    throw new Error(
      `No se pudo parsear JSON de Gemini tras intentos (${attempts.join(', ')}). Fragmento: ${debugSnippet}`,
    );
  }

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
    this.genAINew = new GoogleGenAI({ apiKey });
  }

  async chat(dto: ChatMessageDto): Promise<{ response: string; conversationId: string }> {
    const project = await this.projectsService.findOne(dto.projectId);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const chatModel = this.configService.get<string>('GEMINI_MODEL_CHAT') ?? 'gemini-1.5-flash';
    const model = this.genAI.getGenerativeModel({ model: chatModel });

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
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemContext }],
      },
    });

    let reply = '';
    try {
      const result = await chat.sendMessage(dto.message);
      reply = result.response.text();
    } catch (error) {
      this.logger.error(`Error en Gemini chat: ${String(error)}`);
      throw new Error('No se pudo obtener respuesta de IA. Intenta nuevamente.');
    }

    let conversationId = dto.conversationId;
    try {
      let conversation = dto.conversationId
        ? await this.conversationsRepo.findOne({
          where: { id: dto.conversationId, projectId: dto.projectId },
        })
        : null;

      if (!conversation) {
        conversation = await this.conversationsRepo.findOne({
          where: { projectId: dto.projectId },
        });
      }

      if (!conversation) {
        conversation = this.conversationsRepo.create({
          projectId: dto.projectId,
          userId: this.ANONYMOUS_USER_ID,
        });
      }

      conversation = await this.conversationsRepo.save(conversation);
      conversationId = conversation.id;
      if (!conversationId) {
        throw new Error('No se generó conversationId para la conversación');
      }
    } catch (error) {
      this.logger.warn(`No se pudo guardar conversación: ${String(error)}`);

      if (!conversationId) {
        conversationId = dto.conversationId ?? randomUUID();
      }
    }

    return { response: reply, conversationId };
  }

  async generatePlan(dto: GeneratePlanDto): Promise<{
    detailedConcept: string;
    blueprintSvg: string;
    suggestedMaterials: Array<{ legacyCode: string; quantity: number; reason: string }>;
  }> {
    const project = await this.projectsService.findOne(dto.projectId);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const planModel = this.configService.get<string>('GEMINI_MODEL_PLAN') ?? 'gemini-1.5-flash';
    const model = this.genAI.getGenerativeModel({ model: planModel });

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

INSTRUCCIONES PARA blueprintSvg — SISTEMA DE GRILLA FIJA:

Usa SIEMPRE estas dimensiones fijas sin importar el tamaño del proyecto:
- ViewBox: "0 0 800 600"
- Área dibujable: x=80, y=80, width=640, height=440
- Escala: 1 celda = 80px = aproximadamente 3 metros

GRILLA DE POSICIONAMIENTO (columnas x filas de 80px):
Col 0=80, Col 1=160, Col 2=240, Col 3=320, Col 4=400, Col 5=480, Col 6=560, Col 7=640
Fila 0=80, Fila 1=160, Fila 2=240, Fila 3=320, Fila 4=400, Fila 5=480

REGLAS DE DIBUJO:
1. Cada ambiente ocupa celdas completas (múltiplos de 80px)
2. NUNCA dos ambientes pueden compartir el mismo espacio en la grilla
3. Todos los ambientes deben estar DENTRO del área dibujable (x:80-720, y:80-520)
4. Las paredes se dibujan con <rect> stroke="#333" strokeWidth="3" fill="none"
5. El texto del ambiente va centrado con <text> fontSize="11"
6. Las puertas son arcos <path> de 40px de radio
7. Las ventanas son líneas dobles en el muro

ESTRUCTURA DEL PLANO:
Calcula la distribución ANTES de escribir el SVG:
- Lista todos los ambientes con su tamaño en celdas (ej: sala 2x2, cocina 1x2)
- Verifica que la suma total de celdas no exceda el área disponible (8x6=48 celdas)
- Asigna posición (col, fila) a cada ambiente sin solapamiento

EJEMPLO DE AMBIENTE CORRECTO:
<rect x="80" y="80" width="160" height="160" stroke="#333" stroke-width="3" fill="#f5f5f0"/>
<text x="160" y="165" text-anchor="middle" font-size="11" fill="#333">SALA</text>
<text x="160" y="178" text-anchor="middle" font-size="9" fill="#666">4.8 x 4.8 m</text>

IMPORTANTE: Responde con SVG válido, sin markdown, sin backticks, sin explicaciones.
El SVG debe ser el valor completo del campo blueprintSvg en el JSON.
Escapa correctamente las comillas dentro del SVG para que sea JSON válido.

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
      parsed = this.parseGeminiJson(text) as PlanResponse;
    } catch (error) {
      this.logger.error(`Error parseando respuesta de Gemini: ${text.substring(0, 500)}`);
      this.logger.error(`Detalle parseo Gemini: ${String(error)}`);
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
          existing.modelUsed = planModel;
          await this.assetsRepo.save(existing);
        } else {
          const asset = this.assetsRepo.create({
            projectId: dto.projectId,
            assetType: AiAssetType.BLUEPRINT,
            storageUrl: parsed.blueprintSvg,
            status: AiAssetStatus.READY,
            prompt: parsed.blueprintPrompt ?? 'Blueprint generado por IA',
            modelUsed: planModel,
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

  async generateRender(projectId: string): Promise<{ imageUrl: string }> {
    const project = await this.projectsService.findOne(projectId);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const renderPrompt = (project as any).renderPrompt;
    if (!renderPrompt) {
      throw new Error('El proyecto no tiene prompt de render. Genera el plan primero.');
    }

    const imageModel = this.configService.get<string>('GEMINI_MODEL_IMAGE')
      ?? 'gemini-2.0-flash-preview-image-generation';

    let imageDataUrl = '';
    try {
      const response = await this.genAINew.models.generateContent({
        model: imageModel,
        contents: renderPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const { mimeType, data } = part.inlineData;
          imageDataUrl = `data:${mimeType ?? 'image/png'};base64,${data}`;
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Error en Gemini generateRender: ${String(error)}`);
      throw new Error('No se pudo generar el render. Intenta nuevamente.');
    }

    if (!imageDataUrl) {
      throw new Error('Gemini no devolvió imagen para el render. Intenta de nuevo.');
    }

    try {
      const existing = await this.assetsRepo.findOne({
        where: { projectId, assetType: AiAssetType.RENDER },
      });
      if (existing) {
        existing.storageUrl = imageDataUrl;
        existing.status = AiAssetStatus.READY;
        existing.prompt = renderPrompt;
        existing.modelUsed = imageModel;
        await this.assetsRepo.save(existing);
      } else {
        const asset = this.assetsRepo.create({
          projectId,
          assetType: AiAssetType.RENDER,
          storageUrl: imageDataUrl,
          status: AiAssetStatus.READY,
          prompt: renderPrompt,
          modelUsed: imageModel,
        });
        await this.assetsRepo.save(asset);
      }
    } catch (err) {
      this.logger.warn('No se pudo guardar render asset: ' + String(err));
    }

    return { imageUrl: imageDataUrl };
  }

  async generatePanorama(projectId: string): Promise<{ imageUrl: string }> {
    const project = await this.projectsService.findOne(projectId);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const panoPrompt = (project as any).panoPrompt;
    if (!panoPrompt) {
      throw new Error('El proyecto no tiene prompt de panorama. Genera el plan primero.');
    }

    const imageModel = this.configService.get<string>('GEMINI_MODEL_IMAGE')
      ?? 'gemini-2.0-flash-preview-image-generation';

    let imageDataUrl = '';
    try {
      const response = await this.genAINew.models.generateContent({
        model: imageModel,
        contents: panoPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const { mimeType, data } = part.inlineData;
          imageDataUrl = `data:${mimeType ?? 'image/png'};base64,${data}`;
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Error en Gemini generatePanorama: ${String(error)}`);
      throw new Error('No se pudo generar el tour virtual. Intenta nuevamente.');
    }

    if (!imageDataUrl) {
      throw new Error('Gemini no devolvió imagen para el panorama. Intenta de nuevo.');
    }

    try {
      const existing = await this.assetsRepo.findOne({
        where: { projectId, assetType: AiAssetType.PANORAMA },
      });
      if (existing) {
        existing.storageUrl = imageDataUrl;
        existing.status = AiAssetStatus.READY;
        existing.prompt = panoPrompt;
        existing.modelUsed = imageModel;
        await this.assetsRepo.save(existing);
      } else {
        const asset = this.assetsRepo.create({
          projectId,
          assetType: AiAssetType.PANORAMA,
          storageUrl: imageDataUrl,
          status: AiAssetStatus.READY,
          prompt: panoPrompt,
          modelUsed: imageModel,
        });
        await this.assetsRepo.save(asset);
      }
    } catch (err) {
      this.logger.warn('No se pudo guardar panorama asset: ' + String(err));
    }

    return { imageUrl: imageDataUrl };
  }

}
