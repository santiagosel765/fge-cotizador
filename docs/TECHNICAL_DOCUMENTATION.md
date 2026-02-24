# Documentación Técnica Completa — FGE Cotizador

## 1) Resumen Ejecutivo del Prototipo

### ¿Qué hace exactamente la aplicación?
El prototipo permite al usuario describir un proyecto de construcción en Guatemala (tipo de obra, espacios, dimensiones y materiales), y luego ejecuta un flujo asistido por IA que:
1. Genera un **concepto técnico detallado** del proyecto.
2. Genera un **plano arquitectónico 2D** (imagen).
3. Genera un **render fotorrealista exterior** (imagen).
4. Genera una **imagen panorámica para tour virtual 360°**.
5. Genera una **lista de materiales sugeridos** con cantidades (usando IDs del catálogo local).
6. Calcula **subtotal + IVA (12%) + total** de cotización.
7. Permite agregar/quitar materiales manualmente.
8. Permite abrir un **chat IA** y pedir asesoría sobre la cotización.
9. Permite registrar una **solicitud de crédito** (simulada) con ticket local.
10. Permite **exportar a PDF** con imágenes y tabla de materiales.
11. Permite capturar una **ubicación del proyecto** con mapa (Leaflet + OSM) y geolocalización.

### Tecnologías usadas actualmente
- **Frontend SPA**: React + TypeScript + Vite.
- **IA**: SDK `@google/genai` consumido directamente desde cliente.
- **Modelos Gemini/Imagen**: `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-image`, `imagen-4.0-generate-001`.
- **Visualización 360**: A-Frame (script CDN).
- **Mapa**: Leaflet + OpenStreetMap (scripts CDN).
- **PDF**: jsPDF + jspdf-autotable (scripts CDN).
- **UI**: Tailwind vía CDN + animate.css.

### Estado funcional (implementado vs simulado)
- ✅ Flujo principal de cotización con IA y materiales.
- ✅ Render/plano/tour virtual con carga y manejo de errores.
- ✅ Chat IA con sesión y mensajes.
- ✅ Exportación PDF en cliente.
- ✅ Mapa con geolocalización y marcador draggable.
- 🔧 Solicitud de crédito: no persiste ni integra backend; genera ticket con `Date.now()`.
- 🔧 Dirección del mapa: solo input visual, no geocodificación ni persistencia.
- 🔧 No hay autenticación, multiusuario, roles, ni persistencia de proyectos.

### Limitaciones de arquitectura actual
- Toda la lógica sensible (prompts, API key e integración IA) ocurre en frontend.
- No hay base de datos ni APIs propias.
- Dependencia de scripts CDN globales (Leaflet, jsPDF, A-Frame, Tailwind) en lugar de módulos empaquetados.
- Estado solo en memoria (`useState`), se pierde al recargar.
- Errores de red/API no centralizados ni trazables en backend.
- Sin observabilidad, auditoría, control de costos/token ni rate limiting.

---

## 2) Funcionalidades Detalladas

### 2.1 Asistente IA conversacional (chat)
- **Descripción**: chat flotante para preguntas libres de construcción y análisis de la lista de materiales.
- **Estado actual**: ✅ Implementado.
- **Componentes involucrados**:
  - `App.tsx`
  - `components/ChatFab.tsx`
  - `components/ChatPopup.tsx`
  - `services/geminiService.ts`
- **Lógica actual**:
  - Al iniciar app, crea sesión con `createChatSession()`.
  - Mensajes se guardan en `chatMessages` (memoria).
  - Botón “Obtener consejos” construye prompt con materiales actuales y envía al chat.
- **Llamadas a Gemini**:
  - `ai.chats.create` con modelo `gemini-2.5-flash` y `systemInstruction` experto en construcción de Guatemala.
  - `chat.sendMessage({ message })` para cada interacción.
  - Prompt de consejos (desde `App.tsx`): resumen de materiales + solicitud de optimización/faltantes.
- **Datos de entrada**: texto libre usuario; lista de materiales para modo “consejos”.
- **Datos de salida**: texto Markdown renderizado en burbujas.
- **Dependencias externas**: `@google/genai`, `react-markdown`.
- **Notas para migración**:
  - Mover sesión y conversación al backend (persistencia).
  - Guardar historial por proyecto/usuario.
  - Aplicar límites por usuario y presupuesto de tokens.

### 2.2 Generación de plano arquitectónico 2D
- **Descripción**: genera imagen 2D técnica basada en descripción estructurada.
- **Estado actual**: ✅ Implementado.
- **Componentes involucrados**:
  - `App.tsx`
  - `components/BlueprintVisualization.tsx`
  - `services/geminiService.ts`
- **Lógica actual**:
  - Primero se genera plan conceptual (`generateProjectPlan`), de ahí sale `blueprintPrompt`.
  - Luego `generateBlueprintImage(blueprintPrompt)` produce imagen base64.
- **Llamadas a Gemini**:
  - Modelo `gemini-2.5-flash-image` con `responseModalities: [IMAGE]`.
- **Datos de entrada**: prompt textual derivado del plan.
- **Datos de salida**: data URL de imagen.
- **Dependencias externas**: `@google/genai`.
- **Notas para migración**:
  - Backend debe almacenar activo generado (S3/obj storage + metadatos).
  - Guardar prompt, modelo, estado y costo de operación.

### 2.3 Render fotorrealista exterior
- **Descripción**: imagen realista exterior coherente con materiales y estilo de bajo costo.
- **Estado actual**: ✅ Implementado.
- **Componentes involucrados**:
  - `App.tsx`
  - `components/StaticRenderVisualization.tsx`
  - `services/geminiService.ts`
- **Lógica actual**: `generateRenderImage(renderPrompt)` usa API de imágenes.
- **Llamadas a Gemini**:
  - Modelo `imagen-4.0-generate-001`.
- **Datos de entrada**: prompt textual.
- **Datos de salida**: data URL JPEG.
- **Dependencias externas**: `@google/genai`.
- **Notas para migración**:
  - En backend: cola asíncrona opcional para generación pesada.
  - Persistir revisiones/versiones por proyecto.

### 2.4 Tour Virtual 360°
- **Descripción**: genera panorama IA y lo muestra en visor 360 con A-Frame.
- **Estado actual**: ✅ Implementado (visualización básica).
- **Componentes involucrados**:
  - `App.tsx`
  - `components/ProjectVisualization.tsx`
  - `services/geminiService.ts`
- **Lógica actual**:
  - Genera imagen con `gemini-2.5-flash-image`.
  - Convierte data URL a `Blob` para usarlo como `src` de `<a-sky>`.
- **Llamadas a Gemini**:
  - Modelo `gemini-2.5-flash-image`.
- **Datos de entrada**: `panoPrompt` (de plan conceptual).
- **Datos de salida**: panorama renderizado en escena A-Frame.
- **Dependencias externas**: A-Frame CDN.
- **Notas para migración**:
  - Reemplazar dependencia global por wrapper cliente en Next.js.
  - Evaluar `dynamic(() => import(...), { ssr: false })`.

### 2.5 Cotizador con catálogo de materiales (GTQ + IVA 12%)
- **Descripción**: tabla de materiales con cálculo de costos y resumen tributario.
- **Estado actual**: ✅ Implementado.
- **Componentes involucrados**:
  - `constants.ts` (catálogo + IVA)
  - `App.tsx` (estado y subtotal)
  - `components/MaterialForm.tsx`
  - `components/QuoteTable.tsx`
  - `components/Summary.tsx`
- **Lógica actual**:
  - Catálogo hardcodeado `MATERIALS_DB`.
  - IA sugiere `{id, quantity}`, luego se mapea contra `materialsMap`.
  - Subtotal: suma `price * quantity`; IVA = `subtotal * 0.12`.
- **Llamadas a Gemini**:
  - `getMaterialSuggestions(projectConcept)` con prompt de ingeniería + esquema JSON estricto.
- **Datos de entrada**: sugerencias IA o entrada manual.
- **Datos de salida**: tabla de cotización y resumen total.
- **Dependencias externas**: `@google/genai`.
- **Notas para migración**:
  - Catálogo debe vivir en PostgreSQL (no en código).
  - Precios por vigencia/región/proveedor.

### 2.6 Mapa de ubicación (Leaflet/OpenStreetMap)
- **Descripción**: muestra mapa centrado en Guatemala y detecta ubicación del usuario.
- **Estado actual**: ⚠️ Parcial.
- **Componentes involucrados**:
  - `components/LocationManager.tsx`
  - `index.html` (Leaflet CSS/JS CDN)
- **Lógica actual**:
  - Inicializa mapa con `L.map` y `tileLayer` OSM.
  - Botón usa `navigator.geolocation` para mover marcador.
  - Input de dirección no geocodifica.
- **Llamadas a Gemini**: ❌ No aplica.
- **Datos de entrada**: geolocalización navegador + texto de dirección.
- **Datos de salida**: posición de marcador en UI.
- **Dependencias externas**: Leaflet global + OSM tiles.
- **Notas para migración**:
  - Persistir coordenadas/dirección en proyecto.
  - Integrar geocodificación real (Nominatim/Google/Mapbox).

### 2.7 Solicitud de crédito a FGE
- **Descripción**: modal con nombre/teléfono y ticket de confirmación.
- **Estado actual**: 🔧 Simulado/Hardcodeado.
- **Componentes involucrados**:
  - `components/CreditModal.tsx`
  - `App.tsx`
- **Lógica actual**:
  - Validación local (nombre >= 3; teléfono 8 dígitos).
  - Ticket generado como `FGE-${Date.now()}`.
  - No guarda ni envía datos a API.
- **Llamadas a Gemini**: ❌ No aplica.
- **Datos de entrada**: nombre, teléfono.
- **Datos de salida**: ticket en UI.
- **Dependencias externas**: ninguna.
- **Notas para migración**:
  - Crear flujo backend (registro, estado, SLA, seguimiento).
  - Integración con CRM interno de FGE.

### 2.8 Exportación a PDF
- **Descripción**: descarga cotización con cabecera, imágenes, tabla y resumen.
- **Estado actual**: ✅ Implementado.
- **Componentes involucrados**:
  - `components/ExportButton.tsx`
  - `index.html` (scripts CDN jsPDF/autotable)
- **Lógica actual**:
  - Usa `window.jspdf` global.
  - Inserta blueprint/render si existen.
  - Agrega tabla con `autoTable`.
- **Llamadas a Gemini**: ❌ No aplica directamente.
- **Datos de entrada**: items, subtotal, URLs imágenes.
- **Datos de salida**: archivo `Cotizacion-Genesis-Empresarial.pdf`.
- **Dependencias externas**: jsPDF + AutoTable CDN.
- **Notas para migración**:
  - Recomendable generar en backend para trazabilidad y almacenamiento.

### 2.9 Asistente de formulario (preguntas guiadas)
- **Descripción**: mini asistente binario para completar campos del planificador.
- **Estado actual**: ✅ Implementado.
- **Componentes involucrados**:
  - `components/AiPlannerAssistant.tsx`
  - `components/ProjectPlanner.tsx`
- **Lógica actual**: arreglo `SUGGESTIONS` fijo con preguntas y valores.
- **Llamadas a Gemini**: ❌ No (no usa IA real).
- **Datos de entrada/salida**: clicks Sí/No; concatena texto en campos.
- **Dependencias externas**: ninguna.
- **Notas para migración**:
  - Puede mantenerse como UX local o reemplazarse por asistente dinámico respaldado por backend.

---

## 3) Arquitectura Actual (AS-IS)

### 3.1 Estructura de archivos comentada
```text
.
├─ App.tsx                      # Orquestador principal: estado global de UI y flujo IA
├─ index.tsx                    # Bootstrap ReactDOM
├─ constants.ts                 # Catálogo hardcodeado de materiales + IVA
├─ types.ts                     # Tipos de dominio y tipado JSX global para A-Frame
├─ services/
│  └─ geminiService.ts          # Todas las llamadas Gemini/Imagen + prompts
├─ components/
│  ├─ ProjectPlanner.tsx        # Formulario de definición de proyecto
│  ├─ AiPlannerAssistant.tsx    # Preguntas guiadas tipo sí/no (hardcodeado)
│  ├─ BlueprintVisualization.tsx# Contenedor UI para plano 2D
│  ├─ StaticRenderVisualization.tsx # Contenedor UI para render exterior
│  ├─ ProjectVisualization.tsx  # Visor A-Frame para panorama 360
│  ├─ MaterialForm.tsx          # Alta manual de materiales a cotización
│  ├─ QuoteTable.tsx            # Tabla de items cotizados
│  ├─ Summary.tsx               # Subtotal + IVA + total
│  ├─ LocationManager.tsx       # Mapa Leaflet + geolocalización
│  ├─ CreditModal.tsx           # Solicitud crédito simulada
│  ├─ ExportButton.tsx          # PDF cliente con jsPDF
│  ├─ ChatFab.tsx               # Botón flotante de chat
│  ├─ ChatPopup.tsx             # Ventana de conversación IA
│  ├─ AiAdvisor.tsx             # Componente legacy/no usado por App
│  └─ DynamicImageViewer.tsx    # Componente legacy/no usado (pannellum)
├─ index.html                   # Carga scripts CDN (Tailwind, Leaflet, jsPDF, A-Frame)
├─ vite.config.ts               # Inyección API key en process.env.*
├─ tsconfig.json                # Config TS bundler
└─ package.json                 # Dependencias y scripts
```

### 3.2 Flujo de datos
```mermaid
flowchart TD
    U[Usuario] --> PP[ProjectPlanner]
    PP -->|description| A[App.handleGenerateProject]
    A --> GP[generateProjectPlan]
    GP -->|detailedConcept + prompts| A
    A --> MS[getMaterialSuggestions]
    A --> RI[generateRenderImage]
    A --> BI[generateBlueprintImage]
    A --> PI[generate360Image]
    MS --> QT[QuoteTable/Summary]
    RI --> RV[StaticRenderVisualization]
    BI --> BV[BlueprintVisualization]
    PI --> TV[ProjectVisualization]
    QT --> EX[ExportButton PDF]
    U --> CF[ChatFab/ChatPopup]
    CF --> SC[sendMessageToChat]
    QT -->|material list prompt| SC
```

### 3.3 Estado de la aplicación
- Manejo con `useState`, `useMemo`, `useCallback`, `useEffect` en `App.tsx`.
- Estado en memoria:
  - Cotización, errores/cargas, imágenes, chat session/mensajes, modal crédito.
- Persistencia:
  - ❌ Ninguna (sin localStorage, sin backend, sin DB).

### 3.4 Llamadas a Gemini API (inventario completo)
1. **`generateProjectPlan(userDescription)`**
   - Propósito: convertir solicitud libre en JSON estructurado con `detailedConcept`, `blueprintPrompt`, `renderPrompt`, `panoPrompt`.
   - Modelo: `gemini-2.5-pro`.
   - Formato esperado: JSON object validado por `responseSchema`.

2. **`getMaterialSuggestions(projectConcept)`**
   - Propósito: convertir concepto detallado en array `{id, quantity}` usando solo catálogo permitido.
   - Modelo: `gemini-2.5-flash`.
   - Formato esperado: JSON array validado por `responseSchema`.

3. **`generateRenderImage(prompt)`**
   - Propósito: render exterior.
   - Modelo: `imagen-4.0-generate-001`.
   - Respuesta esperada: `generatedImages[0].image.imageBytes`.

4. **`generateBlueprintImage(prompt)`**
   - Propósito: plano 2D como imagen.
   - Modelo: `gemini-2.5-flash-image`.
   - Respuesta esperada: parte con `inlineData.data`.

5. **`generate360Image(prompt)`**
   - Propósito: panorama para tour virtual.
   - Modelo: `gemini-2.5-flash-image`.
   - Respuesta esperada: parte con `inlineData.data`.

6. **`createChatSession()` + `sendMessageToChat()`**
   - Propósito: chat conversacional continuo.
   - Modelo: `gemini-2.5-flash`.
   - Respuesta esperada: texto Markdown.

### 3.5 Prompts críticos (estructura exacta)

#### A) Prompt maestro de conceptualización (`generateProjectPlan`)
```text
ROL: Eres un Agente de Diseño Inteligente especializado...
INSTRUCCIÓN DE COHERENCIA MÁXIMA...
REGLA DE INTERPRETACIÓN Y ESCALA DE DISEÑO...
TAREA:
Basado en la solicitud del usuario, genera un objeto JSON que contenga 4 propiedades.
...
1) detailedConcept
2) blueprintPrompt
3) renderPrompt
4) panoPrompt
...
Tu respuesta debe ser únicamente el objeto JSON...
```

#### B) Prompt de materiales (`getMaterialSuggestions`)
```text
Actúa como un ingeniero civil o arquitecto experto en construcción y costos en Guatemala.
... OBLIGATORIO incluir: Obra gris, Plomería, Electricidad, Aberturas, Acabados.
...
Lista de Materiales Disponibles (ID, nombre, unidad): ${materialListForPrompt}
Descripción Detallada del Proyecto: "${projectConcept}"
...
Devuelve únicamente un array JSON con objetos { id, quantity }.
```

#### C) Prompt para consejos en chat (`handleGetAdviceInChat`)
```text
Por favor, analiza la siguiente lista de materiales y dame tus recomendaciones...
Dame un resumen breve del posible proyecto, consejos de optimización,
y sugiere 1 o 2 materiales que podrían faltar. Sé breve y directo.
```

---

## 4) Diseño de Base de Datos PostgreSQL (TO-BE)

> Diseño propuesto para producción, normalizado y con auditoría básica.

### tabla: users
- **Propósito**: usuarios del sistema (asesores/clientes/admin).
- **Columnas**:

| columna | tipo | restricciones | descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | identificador |
| email | citext | UNIQUE NOT NULL | correo login |
| password_hash | text | NULL | hash si auth local |
| full_name | text | NOT NULL | nombre completo |
| phone | varchar(20) | NULL | teléfono |
| role | varchar(20) | NOT NULL default 'client' | client/advisor/admin |
| created_at | timestamptz | NOT NULL default now() | auditoría |
| updated_at | timestamptz | NOT NULL default now() | auditoría |
| deleted_at | timestamptz | NULL | soft delete |

- **Relaciones**: 1:N con `projects`, `credit_requests`, `ai_conversations`.
- **Índices sugeridos**: unique(email), idx(role), idx(deleted_at).

### tabla: projects
- **Propósito**: expediente principal del proyecto/cotización.
- **Columnas**:

| columna | tipo | restricciones | descripción |
|---|---|---|---|
| id | uuid | PK | proyecto |
| user_id | uuid | FK -> users.id | propietario |
| name | text | NOT NULL | nombre corto |
| user_description | text | NOT NULL | input original |
| detailed_concept | text | NULL | salida IA |
| status | varchar(20) | NOT NULL default 'draft' | draft/generated/approved |
| address_text | text | NULL | dirección escrita |
| latitude | numeric(9,6) | NULL | latitud |
| longitude | numeric(9,6) | NULL | longitud |
| subtotal_gtq | numeric(14,2) | NOT NULL default 0 | subtotal |
| iva_rate | numeric(5,4) | NOT NULL default 0.12 | tasa IVA |
| iva_gtq | numeric(14,2) | NOT NULL default 0 | monto IVA |
| total_gtq | numeric(14,2) | NOT NULL default 0 | total |
| created_at | timestamptz | NOT NULL default now() | auditoría |
| updated_at | timestamptz | NOT NULL default now() | auditoría |
| deleted_at | timestamptz | NULL | soft delete |

- **Relaciones**: 1:N `project_rooms`, `quotation_items`, `ai_generated_assets`, `ai_conversations`.
- **Índices sugeridos**: idx(user_id, created_at desc), idx(status), gist/geography opcional para ubicación.

### tabla: project_rooms
- **Propósito**: ambientes/espacios declarados por proyecto.
- **Columnas**: id (uuid PK), project_id (uuid FK), name, width_m, length_m, height_m, area_m2, notes, created_at.
- **Relaciones**: N:1 `projects`.
- **Índices**: idx(project_id).

### tabla: material_categories
- **Propósito**: clasificar catálogo (obra gris, plomería, etc.).
- **Columnas**: id (uuid PK), code (varchar UNIQUE), name, description, created_at.
- **Relaciones**: 1:N `materials`.
- **Índices**: unique(code), idx(name).

### tabla: materials
- **Propósito**: catálogo de materiales versionable.
- **Columnas**:

| columna | tipo | restricciones | descripción |
|---|---|---|---|
| id | uuid | PK | interno |
| legacy_code | varchar(20) | UNIQUE NOT NULL | código actual (ej. `cem-01`) |
| category_id | uuid | FK -> material_categories.id | categoría |
| name | text | NOT NULL | nombre material |
| unit | varchar(50) | NOT NULL | unidad comercial |
| unit_price_gtq | numeric(14,2) | NOT NULL | precio |
| is_active | boolean | NOT NULL default true | disponibilidad |
| created_at | timestamptz | NOT NULL default now() | auditoría |
| updated_at | timestamptz | NOT NULL default now() | auditoría |

- **Relaciones**: 1:N `quotation_items`.
- **Índices**: unique(legacy_code), idx(category_id), idx(is_active).

### tabla: quotations
- **Propósito**: encabezado de cotización (versiones por proyecto).
- **Columnas**: id uuid PK, project_id FK, version int, subtotal_gtq, iva_rate, iva_gtq, total_gtq, generated_by ('ai'|'manual'), created_at.
- **Relaciones**: N:1 `projects`; 1:N `quotation_items`.
- **Índices**: unique(project_id, version), idx(project_id, created_at desc).

### tabla: quotation_items
- **Propósito**: líneas de cotización.
- **Columnas**: id uuid PK, quotation_id FK, material_id FK, quantity numeric(14,3), unit_price_gtq numeric(14,2), subtotal_gtq numeric(14,2), source ('ai'|'manual'), created_at.
- **Relaciones**: N:1 `quotations`, N:1 `materials`.
- **Índices**: idx(quotation_id), idx(material_id), unique opcional (quotation_id, material_id).

### tabla: ai_conversations
- **Propósito**: metadatos de sesiones de chat por proyecto/usuario.
- **Columnas**: id uuid PK, project_id FK, user_id FK, provider text, model text, system_instruction text, created_at.
- **Relaciones**: 1:N `ai_messages`.
- **Índices**: idx(project_id), idx(user_id), idx(created_at).

### tabla: ai_messages
- **Propósito**: historial de mensajes.
- **Columnas**: id uuid PK, conversation_id FK, role varchar(10), message_text text, prompt_tokens int, completion_tokens int, created_at.
- **Relaciones**: N:1 `ai_conversations`.
- **Índices**: idx(conversation_id, created_at).

### tabla: ai_generated_assets
- **Propósito**: activos IA (plano/render/panorama/prompts/resultados).
- **Columnas**: id uuid PK, project_id FK, asset_type varchar(30), model text, prompt text, storage_url text, mime_type text, width int, height int, generation_status varchar(20), error_message text, created_at.
- **Relaciones**: N:1 `projects`.
- **Índices**: idx(project_id), idx(asset_type), idx(generation_status).

### tabla: credit_requests
- **Propósito**: solicitudes de crédito reales.
- **Columnas**: id uuid PK, project_id FK NULL, user_id FK NULL, applicant_name text, phone varchar(20), ticket_number varchar(40) UNIQUE, status varchar(20), notes text, created_at, updated_at.
- **Relaciones**: N:1 `projects`, N:1 `users`.
- **Índices**: unique(ticket_number), idx(status), idx(created_at).

### Diagrama ER (Mermaid)
```mermaid
erDiagram
    users ||--o{ projects : owns
    users ||--o{ ai_conversations : starts
    users ||--o{ credit_requests : submits

    projects ||--o{ project_rooms : contains
    projects ||--o{ quotations : has
    projects ||--o{ ai_generated_assets : produces
    projects ||--o{ ai_conversations : context
    projects ||--o{ credit_requests : references

    material_categories ||--o{ materials : groups
    materials ||--o{ quotation_items : quoted

    quotations ||--o{ quotation_items : includes

    ai_conversations ||--o{ ai_messages : stores
```

### Datos semilla necesarios
- Categorías: `obra_gris`, `plomeria_tuberia`, `plomeria_artefactos`, `electricidad_canalizacion`, `electricidad_acabados`, `acabados`, `aberturas`.
- Materiales: todos los de `MATERIALS_DB` (42 registros).
- IVA default: 0.12 (a nivel configuración y/o columna por cotización).

---

## 5) Arquitectura TO-BE (NestJS + Next.js 14)

### 5.1 Distribución Backend / Frontend por funcionalidad

| Funcionalidad | Backend (NestJS) | Frontend (Next.js) | Endpoints | Tiempo real |
|---|---|---|---|---|
| Planificación IA | Construir prompt, llamar Gemini, validar JSON, persistir plan | Formulario y estados UI | `POST /api/projects/:id/plan` | No |
| Materiales IA | Ejecutar cálculo IA con catálogo DB | Mostrar/editar líneas | `POST /api/projects/:id/material-suggestions` | No |
| Plano/Render/Pano | Orquestar generación, almacenar assets | Renderizar imágenes/visor | `POST /api/projects/:id/assets` | Opcional (polling/WebSocket) |
| Chat IA | Gestionar sesión, historial, costos token | Chat UI | `POST /api/projects/:id/chat/messages` | Opcional streaming SSE |
| Cotización manual | CRUD cotización/items | Tabla y edición | `GET/POST/PATCH /api/quotations...` | No |
| Mapa ubicación | Geocodificación + persistencia coords | Selector de mapa | `PATCH /api/projects/:id/location` | No |
| Crédito | Validación y registro ticket | Modal/form | `POST /api/credit-requests` | No |
| PDF | Generación server-side y storage | Botón descarga | `POST /api/quotations/:id/pdf` | No |

### 5.2 Módulos NestJS necesarios
1. **AuthModule**
   - JWT/sesión, roles.
   - Entidades: `users`.
   - Endpoints: `POST /auth/login`, `POST /auth/register`, `GET /auth/me`.

2. **ProjectsModule**
   - CRUD proyecto + ubicación + estado.
   - Entidades: `projects`, `project_rooms`.
   - Endpoints: `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id`, `PATCH /projects/:id/location`.

3. **MaterialsModule**
   - Catálogo y categorías.
   - Entidades: `materials`, `material_categories`.
   - Endpoints: `GET /materials`, `POST /materials`, `PATCH /materials/:id`.

4. **QuotationsModule**
   - Versionado de cotizaciones e items.
   - Entidades: `quotations`, `quotation_items`.
   - Endpoints: `POST /projects/:id/quotations`, `PATCH /quotation-items/:id`, `GET /quotations/:id`.

5. **AiModule**
   - LLM orchestration, prompts plantillas, assets, chat.
   - Entidades: `ai_generated_assets`, `ai_conversations`, `ai_messages`.
   - Endpoints: `POST /projects/:id/plan`, `POST /projects/:id/assets`, `POST /projects/:id/chat/messages`.

6. **CreditRequestsModule**
   - Registro y seguimiento de solicitudes.
   - Entidades: `credit_requests`.
   - Endpoints: `POST /credit-requests`, `GET /credit-requests/:ticket`, `PATCH /credit-requests/:id/status`.

7. **DocumentsModule**
   - PDF server-side y almacenamiento.
   - Entidades: metadatos opcionales en `ai_generated_assets` o tabla `documents`.
   - Endpoints: `POST /quotations/:id/pdf`, `GET /documents/:id/download`.

### 5.3 Estructura Next.js (App Router)
- `/app/(public)/page.tsx`: landing y CTA.
- `/app/projects/new/page.tsx`: crear proyecto (Client component por formularios).
- `/app/projects/[id]/page.tsx`: tablero principal (Server component + secciones cliente).
- `/app/projects/[id]/quote/page.tsx`: editor cotización.
- `/app/projects/[id]/visuals/page.tsx`: plano/render/tour.
- `/app/projects/[id]/chat/page.tsx`: chat IA.
- `/app/projects/[id]/credit/page.tsx`: solicitud crédito.
- `/app/projects/[id]/documents/page.tsx`: PDFs y exportables.

**Criterio Server/Client**
- Server Components para cargar datos iniciales y SEO.
- Client Components para mapa, chat, formularios y visores 360.

---

## 6) Endpoints API (Contrato)

### [POST] /api/projects
- **Descripción**: crea proyecto base.
- **Request Body**:
```json
{
  "name": "Casa 2 habitaciones",
  "userDescription": "Quiero una vivienda..."
}
```
- **Response 200**:
```json
{ "id": "uuid", "status": "draft" }
```
- **Errores**: 400 validación, 401 no auth.

### [POST] /api/projects/:id/plan
- **Descripción**: genera `detailedConcept` + prompts.
- **Body**:
```json
{ "description": "texto consolidado" }
```
- **Response**:
```json
{
  "detailedConcept": "...",
  "blueprintPrompt": "...",
  "renderPrompt": "...",
  "panoPrompt": "..."
}
```
- **Errores**: 422 respuesta IA inválida, 429 rate limit, 502 proveedor IA.

### [POST] /api/projects/:id/material-suggestions
- **Descripción**: genera listado IA `{id, quantity}`.
- **Body**:
```json
{ "projectConcept": "..." }
```
- **Response**:
```json
[{ "materialId": "uuid", "legacyCode": "blo-01", "quantity": 450 }]
```

### [POST] /api/projects/:id/assets
- **Descripción**: genera uno o más assets IA.
- **Body**:
```json
{ "types": ["blueprint", "render", "pano"] }
```
- **Response**:
```json
[{ "assetType": "render", "url": "https://...", "status": "ready" }]
```

### [POST] /api/projects/:id/chat/messages
- **Descripción**: envía mensaje de chat y guarda histórico.
- **Body**:
```json
{ "message": "¿Qué me falta?", "mode": "free|advice" }
```
- **Response**:
```json
{ "assistantMessage": "...markdown..." }
```

### [POST] /api/projects/:id/quotations
- **Descripción**: crea nueva versión de cotización.
- **Body**:
```json
{ "items": [{ "materialId": "uuid", "quantity": 10 }] }
```
- **Response**:
```json
{ "quotationId": "uuid", "subtotal": 1000, "iva": 120, "total": 1120 }
```

### [PATCH] /api/projects/:id/location
- **Descripción**: actualiza dirección y coordenadas.
- **Body**:
```json
{ "addressText": "Zona 5", "latitude": 14.6, "longitude": -90.5 }
```

### [POST] /api/credit-requests
- **Descripción**: crea solicitud de crédito real.
- **Body**:
```json
{ "projectId": "uuid", "applicantName": "Juan", "phone": "55112233" }
```
- **Response**:
```json
{ "ticketNumber": "FGE-2026-000123", "status": "submitted" }
```

### [POST] /api/quotations/:id/pdf
- **Descripción**: genera PDF y retorna URL de descarga.
- **Response**:
```json
{ "documentId": "uuid", "downloadUrl": "https://..." }
```

---

## 7) Integraciones Externas

### Gemini API
- **Modelos recomendados**:
  - Planeación estructurada: `gemini-2.5-pro`.
  - Materiales/chat: `gemini-2.5-flash`.
  - Imágenes: `imagen-4.0-generate-001` y/o `gemini-2.5-flash-image`.
- **Tokens estimados** (aprox):
  - Plan maestro: 1k–3k input, 500–1.5k output.
  - Materiales: 1k–2k input (catálogo + concepto), 200–600 output.
  - Chat: 50–500 por turno.
- **Rate limiting y resiliencia**:
  - Retry exponencial (solo errores transitorios).
  - Circuit breaker para evitar cascadas.
  - Caching de resultados por hash de prompt.
- **Variables de entorno**:
  - `GEMINI_API_KEY`, `GEMINI_MODEL_PLAN`, `GEMINI_MODEL_CHAT`, etc.

### Leaflet + OpenStreetMap
- **Funcionalidad**: selección de ubicación proyecto + visualización.
- **Dependencias npm**:
  - `leaflet`, `react-leaflet`, `@types/leaflet`.
- **Consideraciones Next.js SSR**:
  - Renderizar mapa solo cliente (`dynamic` con `ssr:false`).
  - Cargar CSS de Leaflet en layout global.

### Generación de PDF
- **Actual**: jsPDF + autotable en cliente.
- **Recomendado producción**:
  - Backend con `pdfkit` o `@react-pdf/renderer` server-side.
  - Guardar PDF en storage y versionar por cotización.
- **Contenido esperado**:
  - Encabezado, fecha, imágenes, tabla materiales, subtotal/IVA/total, pie legal.

---

## 8) Variables de Entorno

### Backend (.env)
- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL=postgresql://user:pass@host:5432/fge_cotizador`
- `JWT_SECRET=super_secret`
- `GEMINI_API_KEY=AIza...`
- `GEMINI_MODEL_PLAN=gemini-2.5-pro`
- `GEMINI_MODEL_CHAT=gemini-2.5-flash`
- `GEMINI_MODEL_IMAGE=imagen-4.0-generate-001`
- `ASSETS_STORAGE_BUCKET=fge-cotizador-assets`
- `ASSETS_PUBLIC_BASE_URL=https://cdn...`
- `RATE_LIMIT_WINDOW_MS=60000`
- `RATE_LIMIT_MAX=60`

### Frontend (.env.local)
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`
- `NEXT_PUBLIC_MAP_DEFAULT_LAT=15.7835`
- `NEXT_PUBLIC_MAP_DEFAULT_LNG=-90.2308`
- `NEXT_PUBLIC_MAP_DEFAULT_ZOOM=7`

> Nota: la API key de Gemini NO debe exponerse en frontend en producción.

---

## 9) Gaps y Trabajo Pendiente

### 9.1 Funcionalidades no implementadas o simuladas
1. **Persistencia de proyectos/cotizaciones** — ❌
   - Falta: backend + DB.
   - Complejidad: Alta.
2. **Solicitud de crédito real** — 🔧
   - Falta: endpoint, almacenamiento, seguimiento.
   - Complejidad: Media.
3. **Ubicación con geocodificación** — ⚠️
   - Falta: convertir dirección a coordenadas y guardar.
   - Complejidad: Media.
4. **Gestión de usuarios/autenticación** — ❌
   - Falta: login/registro/roles.
   - Complejidad: Alta.
5. **Gestión de activos IA en storage** — ❌
   - Falta: bucket, metadatos, lifecycle.
   - Complejidad: Alta.

### 9.2 Decisiones técnicas pendientes
- ORM en NestJS: TypeORM vs Prisma.
- Estrategia PDF: generación síncrona vs job asíncrono.
- Streaming chat: SSE vs WebSocket.
- Proveedor de geocoding (Nominatim/Google/Mapbox).
- Política de versionado de precios de materiales.

### 9.3 Riesgos técnicos
- Costo IA por prompts largos (catálogo inyectado completo en cada llamada).
- Inconsistencias de respuesta IA pese a schema.
- Bloqueos de seguridad/filtros en generación de imágenes.
- Dependencia de scripts CDN y objetos globales.
- Falta de trazabilidad/auditoría para solicitudes de crédito.

### 9.4 Orden sugerido de implementación
1. Base backend + auth + DB + migraciones.
2. Catálogo de materiales y cotizaciones CRUD.
3. Proyectos + ubicación persistente.
4. Módulo IA (plan + materiales) con guardado.
5. Generación de assets IA y almacenamiento.
6. Chat persistente por proyecto.
7. Crédito real.
8. PDF server-side + historial de documentos.
9. Hardening (rate limit, monitoreo, métricas de costo).

---

## 10) Catálogo de Materiales

### 10.1 Estructura actual
Arreglo hardcodeado en `constants.ts`:
```ts
{ id: string; name: string; unit: string; price: number }
```

### 10.2 Materiales extraídos (completos)

| ID | Nombre | Unidad | Precio GTQ | Categoría propuesta |
|---|---|---|---:|---|
| cem-01 | Bolsa de Cemento UGC 3000 PSI | Bolsa 42.5kg | 85.00 | obra_gris |
| hie-01 | Quintal de Hierro Legítimo 3/8" | Quintal | 450.00 | obra_gris |
| hie-02 | Quintal de Hierro Legítimo 1/2" | Quintal | 780.00 | obra_gris |
| hie-03 | Quintal de Hierro Legítimo 1/4" | Quintal | 210.00 | obra_gris |
| blo-01 | Block de 14x19x39 cm | Unidad | 4.50 | obra_gris |
| blo-02 | Block de 19x19x39 cm | Unidad | 6.00 | obra_gris |
| lad-01 | Ladrillo Tubular | Unidad | 2.75 | obra_gris |
| agr-01 | Arena de Río | Metro Cúbico | 200.00 | obra_gris |
| agr-02 | Piedrín | Metro Cúbico | 225.00 | obra_gris |
| lam-01 | Lámina Troquelada 12 pies | Unidad | 130.00 | obra_gris |
| lam-02 | Lámina Termoacústica 12 pies | Unidad | 450.00 | obra_gris |
| acb-01 | Bolsa de Cal | Bolsa 25kg | 35.00 | acabados |
| pvc-01 | Tubo PVC 4" para Drenaje | Vara (6m) | 150.00 | plomeria_tuberia |
| pvc-02 | Tubo PVC 1/2" para Agua Potable | Vara (6m) | 45.00 | plomeria_tuberia |
| pvc-03 | Tubo PVC 3/4" para Agua Potable | Vara (6m) | 70.00 | plomeria_tuberia |
| pvc-04 | Codo PVC 1/2" 90° para Agua | Unidad | 2.50 | plomeria_tuberia |
| pvc-05 | Codo PVC 3/4" 90° para Agua | Unidad | 4.00 | plomeria_tuberia |
| pvc-06 | Te PVC 1/2" para Agua | Unidad | 3.50 | plomeria_tuberia |
| pvc-07 | Te PVC 3/4" para Agua | Unidad | 5.00 | plomeria_tuberia |
| pvc-08 | Adaptador Macho PVC 1/2" | Unidad | 3.00 | plomeria_tuberia |
| pvc-09 | Adaptador Hembra PVC 1/2" | Unidad | 3.00 | plomeria_tuberia |
| pvc-10 | Pegamento para PVC (1/4 galón) | Unidad | 80.00 | plomeria_tuberia |
| pvc-11 | Limpiador para PVC (1/4 galón) | Unidad | 65.00 | plomeria_tuberia |
| pvc-12 | Cinta Teflón | Rollo | 5.00 | plomeria_tuberia |
| san-01 | Inodoro estándar con tanque | Juego | 850.00 | plomeria_artefactos |
| san-02 | Lavamanos de pedestal | Juego | 450.00 | plomeria_artefactos |
| san-03 | Ducha completa (regadera y manerales) | Juego | 375.00 | plomeria_artefactos |
| san-04 | Grifo de cocina monomando | Unidad | 500.00 | plomeria_artefactos |
| ele-01 | Alambre de Amarre | Libra | 12.00 | electricidad_canalizacion |
| ele-02 | Caja de Alambre Eléctrico #12 (100m) | Caja 100m | 450.00 | electricidad_canalizacion |
| ele-03 | Caja de Alambre Eléctrico #14 (100m) | Caja 100m | 350.00 | electricidad_canalizacion |
| ele-04 | Rollo de Poliducto Naranja 1/2" (50m) | Rollo 50m | 150.00 | electricidad_canalizacion |
| ele-05 | Caja Rectangular Plástica 4x2" | Unidad | 3.50 | electricidad_canalizacion |
| ele-06 | Caja Octogonal Plástica 4x4" | Unidad | 4.00 | electricidad_canalizacion |
| ele-12 | Cinta de Aislar | Rollo | 8.00 | electricidad_canalizacion |
| ele-07 | Tomacorriente Doble con Placa | Unidad | 25.00 | electricidad_acabados |
| ele-13 | Tomacorriente 220V para Ducha/Estufa | Unidad | 60.00 | electricidad_acabados |
| ele-08 | Interruptor Sencillo con Placa | Unidad | 20.00 | electricidad_acabados |
| ele-09 | Plafonera de Baquelita | Unidad | 10.00 | electricidad_acabados |
| ele-14 | Lámpara LED de Techo 18W | Unidad | 120.00 | electricidad_acabados |
| ele-15 | Bombillo LED 9W | Unidad | 25.00 | electricidad_acabados |
| ele-10 | Flipón (Breaker) 15A | Unidad | 45.00 | electricidad_acabados |
| ele-11 | Flipón (Breaker) 20A | Unidad | 45.00 | electricidad_acabados |
| ele-16 | Centro de Carga para 4 flipones | Unidad | 150.00 | electricidad_acabados |
| pin-01 | Galón de Pintura de Hule (Blanca) | Galón | 125.00 | acabados |
| pin-02 | Cubeta de Pintura de Hule (Blanca) | Cubeta 5gl | 550.00 | acabados |
| ven-01 | Ventana de aluminio y vidrio 1.00x1.00m | Unidad | 550.00 | aberturas |
| ven-02 | Ventana de aluminio y vidrio 1.50x1.20m | Unidad | 800.00 | aberturas |
| ven-03 | Ventana de baño (celosía) 0.60x0.40m | Unidad | 350.00 | aberturas |
| pue-01 | Puerta interior de MDF con chapa | Juego | 600.00 | aberturas |
| pue-02 | Puerta exterior de metal con chapa | Juego | 1200.00 | aberturas |

### 10.3 SQL de semillas (ejemplo)
```sql
-- categorías
INSERT INTO material_categories (id, code, name) VALUES
(gen_random_uuid(),'obra_gris','Obra Gris'),
(gen_random_uuid(),'plomeria_tuberia','Plomería y Drenajes'),
(gen_random_uuid(),'plomeria_artefactos','Plomería - Artefactos'),
(gen_random_uuid(),'electricidad_canalizacion','Electricidad - Canalización'),
(gen_random_uuid(),'electricidad_acabados','Electricidad - Acabados y Controles'),
(gen_random_uuid(),'acabados','Acabados Generales'),
(gen_random_uuid(),'aberturas','Ventanas y Puertas');

-- materiales (fragmento representativo)
INSERT INTO materials (id, legacy_code, category_id, name, unit, unit_price_gtq)
SELECT gen_random_uuid(), 'cem-01', c.id, 'Bolsa de Cemento UGC 3000 PSI', 'Bolsa 42.5kg', 85.00
FROM material_categories c WHERE c.code='obra_gris';

INSERT INTO materials (id, legacy_code, category_id, name, unit, unit_price_gtq)
SELECT gen_random_uuid(), 'blo-01', c.id, 'Block de 14x19x39 cm', 'Unidad', 4.50
FROM material_categories c WHERE c.code='obra_gris';

INSERT INTO materials (id, legacy_code, category_id, name, unit, unit_price_gtq)
SELECT gen_random_uuid(), 'pvc-01', c.id, 'Tubo PVC 4" para Drenaje', 'Vara (6m)', 150.00
FROM material_categories c WHERE c.code='plomeria_tuberia';
```

> Para producción, generar script completo de los 42 materiales y versionarlo en migraciones.

