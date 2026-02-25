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

  async chat(dto: ChatMessageDto): Promise<{ reply: string }> {
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

INSTRUCCIONES PARA blueprintSvg:
- "blueprintSvg": Un SVG técnico 2D de planta arquitectónica completo y
autocontenido. DEBES seguir estas reglas sin excepción:

PASO 1 — ANALIZA EL PROYECTO:
Lee la descripción del proyecto y extrae:
- Tipo de proyecto (vivienda, local comercial, bodega, ampliación, etc.)
- Dimensiones totales si se especifican, o estímalas según el tipo y espacios
- Lista de ambientes requeridos y sus áreas aproximadas
- Materiales y condicionantes mencionados

PASO 2 — CALCULA EL VIEWBOX Y ESCALA:
- Determina las dimensiones reales del proyecto en metros (ancho x largo)
- Usa escala: 1 metro = 55 píxeles
- Margen para cotas: 80px en cada lado
- viewBox width = (ancho_metros * 55) + 160
- viewBox height = (largo_metros * 55) + 160
- TODOS los elementos del plano deben caber dentro de este viewBox
- Si no conoces las dimensiones exactas, estímalas razonablemente según
  el tipo de proyecto y los ambientes solicitados

PASO 3 — APLICA PRINCIPIOS DE ARQUITECTURA SEGÚN EL TIPO DE PROYECTO:

Para VIVIENDA (cualquier tamaño):
- Zona social (sala, comedor, cocina) con acceso directo desde entrada y luz natural
- Zona privada (dormitorios) separada de zona social, preferiblemente al fondo
- Baño accesible desde pasillo o vestíbulo, NUNCA abriendo directamente a cocina
- Pasillo de distribución de mínimo 90cm de ancho conectando todos los ambientes
- Cocina con ventilación al exterior (ventana)
- Cada dormitorio con ventana al exterior
- Puerta principal en fachada frontal

Para LOCAL COMERCIAL / NEGOCIO:
- Área de atención al cliente amplia al frente con vitrina o acceso directo
- Área de bodega o almacén al fondo
- Servicios sanitarios al fondo con acceso desde área de trabajo
- Acceso de mercancía diferenciado del acceso de clientes si el espacio lo permite

Para BODEGA / DEPÓSITO:
- Área de carga/descarga con acceso vehicular amplio
- Espacio abierto sin divisiones internas innecesarias
- Área administrativa pequeña si se solicitó
- Baño de servicio en esquina

Para AMPLIACIÓN / ANEXO:
- Conectar con la estructura existente en el punto lógico
- Respetar la circulación existente
- Los nuevos ambientes deben ser funcionales por sí solos

Para CUALQUIER TIPO:
- La distribución debe ser LÓGICA y FUNCIONAL
- No dejar ambientes sin acceso
- No cruzar un ambiente para llegar a otro si se puede evitar
- Las puertas deben tener espacio de batiente libre

PASO 4 — GENERA EL SVG CON ESTOS ELEMENTOS:

Paredes exteriores: rect con fill:#2d2d2d, calculado según dimensiones reales
Paredes interiores: rect o line con stroke:#2d2d2d stroke-width:8
Habitaciones/ambientes: rect con fill:#f0f0f0 para zonas sociales,
  fill:#e8f0e8 para dormitorios, fill:#e8e8f5 para baños,
  fill:#f5f0e8 para zonas de servicio/cocina
Ventanas: rect pequeño con fill:#b3d9f7 stroke:#2d2d2d en el espesor de la pared
Puertas: path de arco (quarter circle) + line de batiente, fill:none stroke:#555
Etiquetas: text centrado en cada ambiente con nombre y área en m², font sans-serif
Cotas exteriores: líneas fuera del plano con texto de dimensión en metros
  (usa markers de flecha o líneas cortas perpendiculares como ticks)
Título: texto en la parte inferior "PLANTA ARQUITECTÓNICA" y tipo de proyecto

PASO 5 — VERIFICACIÓN ANTES DE GENERAR:
- ¿Todos los ambientes caben en el viewBox calculado? Si no, aumenta el viewBox
- ¿Cada ambiente tiene al menos una puerta de acceso?
- ¿El baño/servicio sanitario tiene acceso desde pasillo?
- ¿Las etiquetas de texto están dentro de su habitación?
- ¿Las cotas están fuera de los muros exteriores?
- ¿El SVG es completamente autocontenido (sin imports externos)?

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
