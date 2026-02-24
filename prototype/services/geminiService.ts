import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { QuoteItem, Material } from '../types';
import { MATERIALS_DB } from "../constants";

if (!process.env.API_KEY) {
  // This is a placeholder check. The execution environment is expected to have the API_KEY.
  // In a real scenario, this would prevent the app from breaking if the key is missing.
  console.warn("API_KEY for Gemini is not set in environment variables. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface ProjectPlan {
    detailedConcept: string;
    blueprintPrompt: string;
    renderPrompt: string;
    panoPrompt: string;
}

export const generateProjectPlan = async (userDescription: string): Promise<ProjectPlan> => {
    if (!process.env.API_KEY) {
        throw new Error("El servicio de IA no está disponible. Por favor, asegúrese de que la clave de API esté configurada.");
    }
    const prompt = `
        ROL: Eres un Agente de Diseño Inteligente especializado en la generación de proyectos de Vivienda Funcional y de Bajo Costo en Guatemala. Tu rol es tomar una solicitud de usuario y convertirla en un plan de proyecto completo y coherente, que incluye descripciones y prompts para la generación de activos visuales y de materiales.

        INSTRUCCIÓN DE COHERENCIA MÁXIMA: Las secciones de prompts para render, tour virtual y la lista de materiales deben ser una derivación directa e ineludible de la estructura y los materiales definidos en el 'Plano Conceptual'. No debes introducir materiales caros o complejos si el diseño es de bajo costo.

        REGLA DE INTERPRETACIÓN Y ESCALA DE DISEÑO:
        - Tu diseño por defecto es: Vivienda de Bajo Costo y Construcción Tradicional.
        - Estilo Arquitectónico: Funcional, muros de bloque de cemento con acabado de repello/estuco sencillo.
        - Materiales Estructurales: Mampostería confinada (Bloque de cemento) y cubierta de losa maciza o techo de lámina.
        - Tamaño Por Defecto (si el usuario no especifica): Pequeño (aprox. 60-80m², 1 nivel, 2 dormitorios, 1 baño).
        - Solo si el usuario menciona explícitamente elementos de alto costo (ej: "mármol", "piscina"), escala el diseño. De lo contrario, adhiérete al modelo económico.

        TAREA:
        Basado en la solicitud del usuario, genera un objeto JSON que contenga 4 propiedades.

        Solicitud del Usuario:
        "${userDescription}"

        Las 4 propiedades del JSON deben ser:

        1.  "detailedConcept": (string) Una descripción textual detallada del proyecto (el 'Plano Conceptual'). Debe incluir:
            -   Concepto General: Un párrafo breve resumiendo el proyecto.
            -   Dimensiones y Área: Estimación de dimensiones y área total de construcción.
            -   Distribución de Espacios: Descripción funcional de los espacios.
            -   Estructura y Materiales Clave: Especificación de materiales para muros, techo y acabados básicos.
            -   Aberturas: Tipo y cantidad de puertas y ventanas.

        2.  "blueprintPrompt": (string) Un prompt para un modelo de IA de texto-a-imagen para generar un plano de planta 2D. El prompt debe ser muy descriptivo y visual, enfocado en el resultado final. DEBE:
            -   Basarse estrictamente en la distribución y dimensiones del 'detailedConcept'.
            -   Solicitar un 'diagrama de planta arquitectónico, vista superior, 2D, minimalista, sobre un fondo blanco'.
            -   Describir los elementos a incluir: 'líneas claras para los muros, aberturas para puertas y ventanas, y acotaciones con dimensiones simples'.
            -   Instruir al modelo para que el resultado sea un 'estilo de plano técnico, limpio y claro, sin mobiliario, sin texturas, sin sombras y sin colores'.

        3.  "renderPrompt": (string) Un prompt para un modelo de IA de texto-a-imagen para generar una imagen fotorrealista de la VISTA EXTERIOR. Este prompt DEBE:
            -   Corresponder visualmente a los materiales y estilo definidos en 'detailedConcept' (ej. fachada de estuco, bloque expuesto, ventanas sencillas).
            -   Usar términos de renderizado como: "Fotografía arquitectónica fotorrealista, 4k, exterior de una casa de bajo costo recién terminada en Guatemala".
            -   Incluir detalles del 'detailedConcept' como el tipo de techo y ventanas.
            -   Especificar "iluminación diurna, natural y brillante, con un fondo de entorno guatemalteco creíble".

        4. "panoPrompt": (string) Un prompt para un modelo de IA de texto-a-imagen para generar una imagen panorámica de 360 grados del INTERIOR, que sea **estrictamente coherente** con el 'detailedConcept'. Es indispensable que siga la siguiente estructura para construir el prompt:
            -   **Formato y Escena:** Empezar siempre con "fotografía panorámica equirectangular de 360 grados del interior de [espacio principal del detailedConcept, ej: la sala-comedor] de una casa de bajo costo en Guatemala, recién construida y vacía."
            -   **Materiales y Acabados (Extraídos del detailedConcept):** Continuar la frase con "Las paredes son de [material de pared del detailedConcept, ej: estuco liso pintado de blanco]. El piso es de [material de piso inferido, ej: cerámica económica de color claro]. El techo es [descripción del techo del detailedConcept, ej: de losa de concreto expuesta]."
            -   **Aberturas (Extraídas del detailedConcept):** Añadir detalles como "Se puede ver [descripción de ventana del detailedConcept, ej: una ventana de aluminio y vidrio] y [descripción de puerta del detailedConcept, ej: una puerta de madera simple]."
            -   **Iluminación y Ambiente:** Describir la iluminación: "La escena está iluminada por luz de día brillante y natural que entra por la ventana, creando un ambiente limpio y funcional, sin muebles ni decoración."
            -   **Calidad:** Terminar con palabras clave de calidad: "fotorrealista, alta definición, 4k."
            -   El prompt final debe ser una sola frase coherente y muy descriptiva, ensamblada a partir de estas reglas. Es crucial que los materiales y el estilo reflejen una construcción económica.

        Tu respuesta debe ser únicamente el objeto JSON, sin explicaciones ni texto adicional.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        detailedConcept: { type: Type.STRING },
                        blueprintPrompt: { type: Type.STRING },
                        renderPrompt: { type: Type.STRING },
                        panoPrompt: { type: Type.STRING },
                    },
                    required: ['detailedConcept', 'blueprintPrompt', 'renderPrompt', 'panoPrompt']
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating project plan from Gemini API:", error);
        throw new Error("Hubo un error al conceptualizar el proyecto con la IA.");
    }
};


export const getMaterialSuggestions = async (projectConcept: string): Promise<any[]> => {
  if (!process.env.API_KEY) {
    throw new Error("El servicio de IA no está disponible. Por favor, asegúrese de que la clave de API esté configurada.");
  }

  const materialListForPrompt = MATERIALS_DB.map(m => `- ${m.id}: ${m.name} (${m.unit})`).join('\n');

  const prompt = `
    Actúa como un ingeniero civil o arquitecto experto en construcción y costos en Guatemala.
    Tu tarea es analizar la descripción detallada de un proyecto y generar una lista de materiales simulada, pero extremadamente detallada y completa.

    Basado en la descripción, primero, extrae las dimensiones clave (largo, alto, ancho, área, etc.).
    Segundo, utiliza conocimientos estándar de construcción para calcular las cantidades de materiales de obra gris.
    Tercero, y la parte más crucial: esto es una simulación completa de un proyecto. Asume que cualquier espacio habitable (cuarto, casa, baño) debe ser funcional. Por lo tanto, es OBLIGATORIO que incluyas SIEMPRE una lista exhaustiva de materiales para TODOS los sistemas necesarios:
    1.  **Obra Gris:** Cimientos, paredes, techo (cemento, hierro, block, agregados, etc.).
    2.  **Plomería Completa:** Tuberías para agua potable (fría), tuberías de drenaje sanitario, y los artefactos descritos o inferidos (inodoros, duchas, lavamanos).
    3.  **Electricidad Completa:** Canalización (poliducto), cableado, cajas rectangulares y octogonales, tomacorrientes, interruptores y puntos de luz (plafones).
    4.  **Aberturas:** Puertas y ventanas apropiadas para el espacio.
    5.  **Acabados Básicos:** Como pintura.

    No omitas ninguna de estas categorías si el proyecto es para ser habitado. Por ejemplo, si el usuario pide "un cuarto", automáticamente debes incluir electricidad. Si pide "un baño", debes incluir plomería Y electricidad.
    
    Cuarto, genera una lista de materiales utilizando ÚNICAMENTE los IDs y unidades de la siguiente lista. No inventes materiales ni uses IDs que no estén aquí.

    Lista de Materiales Disponibles (Formato: ID: Nombre (Unidad)):
    ${materialListForPrompt}

    Descripción Detallada del Proyecto (generada por IA para máxima coherencia):
    "${projectConcept}"

    Realiza los cálculos necesarios y devuelve una respuesta en formato JSON que sea un array de objetos. Cada objeto debe tener:
    - "id": el ID del material de la lista proporcionada.
    - "quantity": un número entero que representa la cantidad calculada del material. Redondea siempre hacia el entero superior para no quedarte corto de material.

    Ejemplo de respuesta JSON esperada para "construir un cuarto de 4x3 metros con un baño pequeño, una puerta y una ventana":
    [
      { "id": "blo-01", "quantity": 450 },
      { "id": "cem-01", "quantity": 15 },
      { "id": "hie-01", "quantity": 5 },
      { "id": "agr-01", "quantity": 3 },
      { "id": "agr-02", "quantity": 3 },
      { "id": "pvc-01", "quantity": 2 },
      { "id": "pvc-02", "quantity": 4 },
      { "id": "san-01", "quantity": 1 },
      { "id": "san-03", "quantity": 1 },
      { "id": "ele-02", "quantity": 1 },
      { "id": "ele-04", "quantity": 1 },
      { "id": "ele-05", "quantity": 5 },
      { "id": "ele-07", "quantity": 3 },
      { "id": "ele-08", "quantity": 2 },
      { "id": "ele-09", "quantity": 2 },
      { "id": "ven-01", "quantity": 1 },
      { "id": "pue-01", "quantity": 1 },
      { "id": "pin-01", "quantity": 2 }
    ]

    Si la descripción es muy vaga, no es un proyecto de construcción, o es imposible calcular las cantidades, devuelve un array JSON vacío [].
    Tu respuesta final debe ser únicamente el array JSON, sin explicaciones, comentarios o texto adicional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.STRING,
                  description: "El ID del material de la lista proporcionada."
                },
                quantity: {
                  type: Type.INTEGER,
                  description: "La cantidad calculada y redondeada hacia arriba del material, debe ser mayor a 0."
                }
              },
              required: ['id', 'quantity']
            }
        }
      }
    });

    const jsonText = response.text.trim();
    // In case the model returns an empty string for an empty list
    if (!jsonText) return [];
    const suggestions = JSON.parse(jsonText);
    return suggestions;
  } catch (error) {
    console.error("Error fetching material suggestions from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Hubo un error al generar la lista de materiales: ${error.message}`);
    }
    throw new Error("Hubo un error desconocido al generar la lista de materiales.");
  }
};


export const generateRenderImage = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("El servicio de IA no está disponible. Por favor, asegúrese de que la clave de API esté configurada.");
    }

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image.imageBytes) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("La respuesta de la API no contenía datos de imagen.");
        }
    } catch (error) {
        console.error("Error generating image with Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Hubo un error al generar la imagen del proyecto: ${error.message}`);
        }
        throw new Error("Hubo un error desconocido al generar la imagen del proyecto.");
    }
};

export const generateBlueprintImage = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("El servicio de IA no está disponible. Por favor, asegúrese de que la clave de API esté configurada.");
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.data);

        if (imagePart) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType || 'image/jpeg';
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
            console.error("Unexpected API response for blueprint. No image data found in parts:", JSON.stringify(response, null, 2));
            const finishReason = response.candidates?.[0]?.finishReason;
            if (finishReason && finishReason !== 'STOP') {
                 throw new Error(`La generación del plano fue bloqueada por la siguiente razón: ${finishReason}. Intenta con una descripción diferente.`);
            }
            throw new Error("La respuesta de la API no contenía datos del plano. Intenta de nuevo o modifica la descripción.");
        }
    } catch (error) {
        console.error("Error generating blueprint with Gemini API:", error);
        if (error instanceof Error) {
            if (error.message.startsWith("La generación del plano fue bloqueada") || error.message.startsWith("La respuesta de la API no contenía datos del plano")) {
                throw error;
            }
            throw new Error(`Hubo un error al generar el plano del proyecto: ${error.message}`);
        }
        throw new Error("Hubo un error desconocido al generar el plano del proyecto.");
    }
};

export const generate360Image = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("El servicio de IA no está disponible. Por favor, asegúrese de que la clave de API esté configurada.");
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.data);

        if (imagePart) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType || 'image/jpeg';
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
            console.error("Unexpected API response for 360 image. No image data found in parts:", JSON.stringify(response, null, 2));
            const finishReason = response.candidates?.[0]?.finishReason;
            if (finishReason && finishReason !== 'STOP') {
                 throw new Error(`La generación de la imagen 360° fue bloqueada por la siguiente razón: ${finishReason}. Intenta con una descripción diferente.`);
            }
            throw new Error("La respuesta de la API no contenía datos de imagen para el tour 360°. Intenta de nuevo o modifica la descripción.");
        }
    } catch (error) {
        console.error("Error generating 360 image with Gemini API:", error);
        if (error instanceof Error) {
            if (error.message.startsWith("La generación de la imagen 360° fue bloqueada") || error.message.startsWith("La respuesta de la API no contenía datos de imagen")) {
                throw error;
            }
            throw new Error(`Hubo un error al generar el tour virtual 360°: ${error.message}`);
        }
        throw new Error("Hubo un error desconocido al generar el tour virtual 360°.");
    }
};


export const createChatSession = (): Chat => {
    if (!process.env.API_KEY) {
        throw new Error("El servicio de IA no está disponible. Por favor, asegúrese de que la clave de API esté configurada.");
    }
    const systemInstruction = `Eres un asistente de construcción amigable y experto para Guatemala. Tus respuestas deben ser cortas, concisas y fáciles de entender. Cuando sea apropiado, utiliza markdown (negritas, listas) para mejorar la legibilidad. Tu objetivo es ayudar al usuario con sus dudas sobre su proyecto de construcción.`;
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        },
    });
    return chat;
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return "El servicio de IA no está disponible.";
    }
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to Gemini Chat:", error);
        if (error instanceof Error) {
            return `Hubo un error al contactar al asistente de IA: ${error.message}.`;
        }
        return "Hubo un error desconocido al contactar al asistente de IA.";
    }
};
