'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { MaterialCategory, Project } from '@/types/project';
import { RenderViewer } from '@/components/visualizaciones/RenderViewer';
import { VirtualTourViewer } from '@/components/visualizaciones/VirtualTourViewer';
import { TechnicalPlansSection } from '@/components/planificador/TechnicalPlansSection';
import { exportProjectPdf } from '@/lib/pdf/exportProjectPdf';
import MapSection from './components/MapSection';
import ChatTab from './components/ChatTab';
import { CreditRequestModal } from '@/components/credit/CreditRequestModal';

interface CartItem {
  materialId: string;
  name: string;
  unit: string;
  unitPriceGtq: number;
  quantity: number;
}

const IVA_RATE = 0.12;


type CreditRequestSubmission = {
  id: string;
  ticketNumber: string;
  status: string;
  createdAt: string;
};

function ProjectPageContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [blueprintSvg, setBlueprintSvg] = useState<string>('');
  const [detailedConcept, setDetailedConcept] = useState<string>('');
  const [suggestedMaterials, setSuggestedMaterials] = useState<Array<{
    legacyCode: string;
    quantity: number;
    reason: string;
  }>>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [planStep, setPlanStep] = useState('');
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [quotationSaved, setQuotationSaved] = useState(false);
  const [quotationError, setQuotationError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [renderUrl, setRenderUrl] = useState<string>('');
  const [panoLoading, setPanoLoading] = useState(false);
  const [panoError, setPanoError] = useState('');
  const [panoUrl, setPanoUrl] = useState<string>('');
  const autoGenerateCalledRef = useRef(false);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditSubmission, setCreditSubmission] = useState<CreditRequestSubmission | null>(null);

  const [planner, setPlanner] = useState({
    projectType: '',
    dimensions: '',
    mainSpaces: '',
    keyMaterials: '',
    additionalDetails: '',
  });

  const [assistantStep, setAssistantStep] = useState(0);

  const PLANNER_QUESTIONS = [
    {
      question: '¿Tu proyecto es para una vivienda de un solo nivel?',
      yesAction: () => setPlanner(prev => ({ ...prev, projectType: 'Vivienda de un solo nivel' })),
      noAction: () => setPlanner(prev => ({ ...prev, projectType: 'Vivienda de dos niveles' })),
    },
    {
      question: '¿Necesitas 2 o más dormitorios?',
      yesAction: () => setPlanner(prev => ({ ...prev, mainSpaces: prev.mainSpaces ? `${prev.mainSpaces}, 2 dormitorios` : '2 dormitorios' })),
      noAction: () => setPlanner(prev => ({ ...prev, mainSpaces: prev.mainSpaces ? `${prev.mainSpaces}, 1 dormitorio` : '1 dormitorio' })),
    },
    {
      question: '¿Incluirá baño completo?',
      yesAction: () => setPlanner(prev => ({ ...prev, mainSpaces: prev.mainSpaces ? `${prev.mainSpaces}, 1 baño completo` : '1 baño completo' })),
      noAction: () => setPlanner(prev => ({ ...prev, mainSpaces: prev.mainSpaces ? `${prev.mainSpaces}, medio baño` : 'medio baño' })),
    },
    {
      question: '¿Prefieres techo de lámina para optimizar costos?',
      yesAction: () => setPlanner(prev => ({ ...prev, keyMaterials: prev.keyMaterials ? `${prev.keyMaterials}, techo de lámina` : 'techo de lámina' })),
      noAction: () => setPlanner(prev => ({ ...prev, keyMaterials: prev.keyMaterials ? `${prev.keyMaterials}, techo de losa` : 'techo de losa' })),
    },
    {
      question: '¿Usarás block de cemento en las paredes?',
      yesAction: () => setPlanner(prev => ({ ...prev, keyMaterials: prev.keyMaterials ? `${prev.keyMaterials}, paredes de block` : 'paredes de block' })),
      noAction: () => setPlanner(prev => ({ ...prev, keyMaterials: prev.keyMaterials ? `${prev.keyMaterials}, paredes de ladrillo` : 'paredes de ladrillo' })),
    },
  ];

  function handlePlannerAnswer(action: () => void) {
    action();
    setAssistantStep(prev => prev + 1);
  }

  useEffect(() => {
    Promise.all([
      api.get<Project>(`/projects/${id}`),
      api.get<MaterialCategory[]>('/materials/categories'),
    ])
      .then(([projectData, materialData]) => {
        setProject(projectData);
        setCategories(materialData);
        setPlanner({
          projectType: projectData.name ?? '',
          dimensions: '',
          mainSpaces: '',
          keyMaterials: '',
          additionalDetails: '',
        });
      })
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  const allMaterials = useMemo(() => categories.flatMap(category => category.materials ?? []), [categories]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + Number(item.unitPriceGtq) * item.quantity, 0), [cart]);
  const iva = (subtotal * IVA_RATE) / (1 + IVA_RATE);
  const total = subtotal;

  async function handleGeneratePlan() {
    if (!project) return;
    setPlanLoading(true);
    setPlanError('');
    setPlanStep('Actualizando proyecto...');

    const userDescription = [
      planner.projectType && `Tipo: ${planner.projectType}`,
      planner.dimensions && `Dimensiones: ${planner.dimensions}`,
      planner.mainSpaces && `Espacios: ${planner.mainSpaces}`,
      planner.keyMaterials && `Materiales: ${planner.keyMaterials}`,
      planner.additionalDetails && `Detalles adicionales: ${planner.additionalDetails}`,
    ].filter(Boolean).join('. ');

    try {
      // Actualizar descripción (best-effort)
      try {
        await api.patch<Project>(`/projects/${project.id}`, {
          ...(planner.projectType && { name: planner.projectType }),
          ...(userDescription && { userDescription }),
        });
      } catch {
        // Si falla el patch, continuar
      }

      setPlanStep('🧠 Analizando proyecto con IA... (puede tardar 30-60s)');

      const result = await api.post<{
        detailedConcept: string;
        blueprintSvg: string;
        suggestedMaterials: Array<{ legacyCode: string; quantity: number; reason: string }>;
      }>('/ai/plan', { projectId: project.id });

      setPlanStep('✅ Plan generado, cargando resultados...');

      setBlueprintSvg(result.blueprintSvg ?? '');
      setDetailedConcept(result.detailedConcept ?? '');
      setSuggestedMaterials(result.suggestedMaterials ?? []);

      // Auto-poblar carrito con materiales sugeridos
      if (result.suggestedMaterials && result.suggestedMaterials.length > 0) {
        const newCartItems: CartItem[] = [];
        for (const suggested of result.suggestedMaterials) {
          const material = allMaterials.find(m => m.legacyCode === suggested.legacyCode);
          if (material) {
            newCartItems.push({
              materialId: material.id,
              name: material.name,
              unit: material.unit,
              unitPriceGtq: Number(material.unitPriceGtq),
              quantity: suggested.quantity,
            });
          }
        }
        if (newCartItems.length > 0) {
          setCart(newCartItems);
        }
      }

      const updated = await api.get<Project>(`/projects/${project.id}`);
      setProject(updated);
      setPlanStep('');

      // Scroll suave al plano después de generar
      setTimeout(() => {
        document.getElementById('section-blueprint')?.scrollIntoView({
          behavior: 'smooth', block: 'start',
        });
      }, 300);

    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Error generando plan con IA');
      setPlanStep('');
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleSaveQuotation() {
    if (!project || cart.length === 0) return;
    setQuotationSaving(true);
    setQuotationError('');

    try {
      await api.post('/quotations', {
        projectId: project.id,
        items: cart.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPriceGtq: item.unitPriceGtq,
        })),
      });
      setQuotationSaved(true);
      setTimeout(() => setQuotationSaved(false), 3000);
    } catch (err) {
      setQuotationError(err instanceof Error ? err.message : 'Error guardando cotización');
    } finally {
      setQuotationSaving(false);
    }
  }

  async function handleGenerateRender() {
    if (!project) return;
    setRenderLoading(true);
    setRenderError('');
    try {
      const result = await api.post<{ imageUrl: string }>(`/ai/render/${project.id}`, {});
      setRenderUrl(result.imageUrl);
      const updated = await api.get<Project>(`/projects/${project.id}`);
      setProject(updated);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Error generando render');
    } finally {
      setRenderLoading(false);
    }
  }

  async function handleGeneratePanorama() {
    if (!project) return;
    setPanoLoading(true);
    setPanoError('');
    try {
      const result = await api.post<{ imageUrl: string }>(`/ai/panorama/${project.id}`, {});
      setPanoUrl(result.imageUrl);
      const updated = await api.get<Project>(`/projects/${project.id}`);
      setProject(updated);
    } catch (err) {
      setPanoError(err instanceof Error ? err.message : 'Error generando panorama');
    } finally {
      setPanoLoading(false);
    }
  }

  useEffect(() => {
    if (project?.aiAssets) {
      const render = project.aiAssets.find((asset) => asset.assetType === 'render');
      const pano = project.aiAssets.find((asset) => asset.assetType === 'panorama');
      if (render?.storageUrl) setRenderUrl(render.storageUrl);
      if (pano?.storageUrl) setPanoUrl(pano.storageUrl);
    }
  }, [project]);

  useEffect(() => {
    if (
      loading === false
      && project !== null
      && categories.length > 0
      && searchParams.get('autoGenerate') === 'true'
      && autoGenerateCalledRef.current === false
    ) {
      autoGenerateCalledRef.current = true;
      handleGeneratePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, project, categories]);

  function addMaterial() {
    const material = allMaterials.find(m => m.id === selectedMaterialId);
    if (!material || quantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.materialId === selectedMaterialId);
      if (existing) {
        return prev.map(item =>
          item.materialId === selectedMaterialId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          materialId: material.id,
          name: material.name,
          unit: material.unit,
          unitPriceGtq: Number(material.unitPriceGtq),
          quantity,
        },
      ];
    });

    setSelectedMaterialId('');
    setQuantity(1);
  }

  function removeMaterial(materialId: string) {
    setCart(prev => prev.filter(item => item.materialId !== materialId));
  }

  async function handleLocationChange(lat: number, lng: number, addressText?: string) {
    if (!project) return;

    setSavingLocation(true);
    try {
      const updated = await api.patch<Project>(`/projects/${project.id}/location`, {
        latitude: lat,
        longitude: lng,
        addressText,
      });
      setProject(updated);
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleExportPdf() {
    if (!project || exportingPdf) return;

    const blueprintFromAsset = project.aiAssets?.find(a => a.assetType === 'blueprint')?.storageUrl ?? '';

    setExportingPdf(true);
    try {
      await exportProjectPdf({
        projectName: project.name ?? 'Proyecto sin nombre',
        projectType: planner.projectType || project.name || 'No especificado',
        dimensions: planner.dimensions || 'No especificadas',
        generatedAt: new Date(),
        plans: [
          { title: 'Plano Arquitectónico', svg: blueprintSvg || blueprintFromAsset },
          { title: 'Plano Técnico - Acotado', svg: project.planoAcotadoSvg ?? '' },
          { title: 'Plano Técnico - Eléctrico', svg: project.planoElectricoSvg ?? '' },
          { title: 'Plano Técnico - Fuerza', svg: project.planoFuerzaSvg ?? '' },
          { title: 'Plano Técnico - Hidráulico', svg: project.planoHidraulicoSvg ?? '' },
          { title: 'Plano Técnico - Drenajes', svg: project.planoDrenajesSvg ?? '' },
          { title: 'Plano Técnico - Cimentaciones', svg: project.planoCimentacionesSvg ?? '' },
        ],
        quoteItems: cart.map(item => ({
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitPriceGtq: Number(item.unitPriceGtq),
        })),
        subtotal,
        iva,
        total,
        latitude: project.latitude,
        longitude: project.longitude,
        addressText: project.addressText,
        mapContainer: mapSectionRef.current,
      });
    } finally {
      setExportingPdf(false);
    }
  }

  if (loading || !project) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando proyecto...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{project.name}</h1>
          <p className="mt-2 text-blue-200">{project.userDescription}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl">
        <section className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header de sección */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 py-5">
            <h2 className="text-xl font-extrabold">🏗️ Planificador IA</h2>
            <p className="text-blue-200 text-sm mt-1">
              Ajusta los detalles de tu proyecto y genera un plan completo con IA.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda: formulario */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                      Tipo de Proyecto
                    </label>
                    <input
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Vivienda, ampliación, muro"
                      value={planner.projectType}
                      onChange={e => setPlanner(prev => ({ ...prev, projectType: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                      Dimensiones Generales
                    </label>
                    <input
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: 8×10 metros, 70m²"
                      value={planner.dimensions}
                      onChange={e => setPlanner(prev => ({ ...prev, dimensions: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Espacios Principales
                  </label>
                  <input
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 2 dormitorios, 1 baño, sala-comedor"
                    value={planner.mainSpaces}
                    onChange={e => setPlanner(prev => ({ ...prev, mainSpaces: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Materiales Clave
                  </label>
                  <input
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Block, lámina, piso cerámico"
                    value={planner.keyMaterials}
                    onChange={e => setPlanner(prev => ({ ...prev, keyMaterials: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Detalles Adicionales
                  </label>
                  <textarea
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Ej: Acabados sencillos, patio pequeño"
                    value={planner.additionalDetails}
                    onChange={e => setPlanner(prev => ({ ...prev, additionalDetails: e.target.value }))}
                  />
                </div>
              </div>

              {/* Columna derecha: Asistente interactivo */}
              <aside className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 h-fit">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">🏗️ Asistente de Diseño</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Responde para refinar tu proyecto.</p>
                </div>

                {assistantStep < PLANNER_QUESTIONS.length ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700 leading-snug">
                      {PLANNER_QUESTIONS[assistantStep].question}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlannerAnswer(PLANNER_QUESTIONS[assistantStep].yesAction)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-colors"
                      >
                        ✓ Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlannerAnswer(PLANNER_QUESTIONS[assistantStep].noAction)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-colors"
                      >
                        ✗ No
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      Pregunta {assistantStep + 1} de {PLANNER_QUESTIONS.length}
                    </p>
                  </div>
                ) : blueprintSvg ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-2xl">✅</span>
                      <p className="text-sm text-green-700 font-semibold mt-1">
                        ¡Plano arquitectónico listo!
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Genera los planos técnicos adicionales:
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { icon: '📏', label: 'Plano Acotado' },
                        { icon: '⚡', label: 'Eléctrico' },
                        { icon: '🔌', label: 'Fuerza 220V' },
                        { icon: '💧', label: 'Hidráulico' },
                        { icon: '🚰', label: 'Drenajes' },
                        { icon: '🏗️', label: 'Cimentaciones' },
                      ].map(p => (
                        <div
                          key={p.label}
                          className="flex items-center gap-2 text-xs text-slate-600 bg-white rounded-lg px-3 py-1.5 border border-slate-200"
                        >
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Disponibles en la sección de abajo ↓
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-3 py-2">
                    <span className="text-3xl">✅</span>
                    <p className="text-sm text-green-700 font-semibold">¡Proyecto definido!</p>
                    <p className="text-xs text-slate-500">
                      Ajusta los campos y genera el plan.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAssistantStep(0)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      ↺ Repetir preguntas
                    </button>
                  </div>
                )}
              </aside>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 
             text-white font-extrabold py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              {planLoading ? '⏳ Generando plan con IA...' : '✨ Generar Plan con IA'}
            </button>
            {planStep && (
              <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 
                  rounded-lg px-4 py-3">
                {planLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 
                      border-blue-500 border-t-transparent flex-shrink-0" />
                )}
                <p className="text-sm text-blue-700">{planStep}</p>
              </div>
            )}
            {planError && (
              <p className="text-red-600 text-sm mt-2 bg-red-50 border border-red-200 
                rounded-lg px-3 py-2">
                ⚠️ {planError}
              </p>
            )}
          </div>
        </section>

        <section id="section-blueprint" className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📐 Plano Arquitectónico 2D</h2>
            {(blueprintSvg || project.aiAssets?.find(a => a.assetType === 'blueprint')) && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                ✓ Generado
              </span>
            )}
          </div>

          {blueprintSvg ? (
            <div className="w-full overflow-auto rounded-lg border border-slate-200 bg-white p-4"
              style={{ minHeight: '400px' }}>
              <div
                className="w-full"
                style={{ lineHeight: 0 }}
                dangerouslySetInnerHTML={{ __html: blueprintSvg }}
              />
            </div>
          ) : project.aiAssets?.find(a => a.assetType === 'blueprint')?.storageUrl ? (
            <div className="w-full overflow-auto rounded-lg border border-slate-200 bg-white p-4"
              style={{ minHeight: '400px' }}>
              <div
                className="w-full"
                style={{ lineHeight: 0 }}
                dangerouslySetInnerHTML={{
                  __html: project.aiAssets.find(a => a.assetType === 'blueprint')!.storageUrl ?? '',
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-100 
                    rounded-lg border-2 border-dashed border-slate-300">
              <span className="text-4xl mb-2">📐</span>
              <p className="text-slate-500 text-sm font-medium">
                Genera tu proyecto con IA para ver el plano
              </p>
              <p className="text-slate-400 text-xs mt-1">
                El plano SVG aparecerá aquí
              </p>
            </div>
          )}

          {detailedConcept && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Concepto del Proyecto</h4>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {detailedConcept}
              </p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-5">
            <h2 className="text-xl font-extrabold">🗂️ Planos Técnicos</h2>
            <p className="text-slate-300 text-sm mt-1">
              7 planos técnicos generados con IA — según normativa guatemalteca
            </p>
          </div>
          <div className="p-6">
            <TechnicalPlansSection
              projectId={id}
              blueprintGenerated={!!(blueprintSvg || project?.aiAssets?.find(a => a.assetType === 'blueprint'))}
              initialPlans={{
                acotado: project?.planoAcotadoSvg ?? '',
                electrico: project?.planoElectricoSvg ?? '',
                fuerza: project?.planoFuerzaSvg ?? '',
                hidraulico: project?.planoHidraulicoSvg ?? '',
                drenajes: project?.planoDrenajesSvg ?? '',
                cimentaciones: project?.planoCimentacionesSvg ?? '',
              }}
            />
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🖼️ Render Fotorrealista</h2>
            {!renderUrl && project.renderPrompt && (
              <button
                onClick={handleGenerateRender}
                disabled={renderLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 
                   text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {renderLoading ? '⏳ Generando...' : '✨ Generar Render'}
              </button>
            )}
          </div>
          <RenderViewer imageUrl={renderUrl} isLoading={renderLoading} error={renderError} />
          {!project.renderPrompt && !renderLoading && !renderUrl && (
            <p className="text-slate-500 text-sm mt-2">Genera el plan primero para activar el render.</p>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🌐 Tour Virtual 360°</h2>
            {!panoUrl && project.panoPrompt && (
              <button
                onClick={handleGeneratePanorama}
                disabled={panoLoading}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 
                   text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {panoLoading ? '⏳ Generando...' : '✨ Generar Tour 360°'}
              </button>
            )}
          </div>
          <VirtualTourViewer imageUrl={panoUrl} isLoading={panoLoading} error={panoError} />
          {!project.panoPrompt && !panoLoading && !panoUrl && (
            <p className="text-slate-500 text-sm mt-2">Genera el plan primero para activar el tour.</p>
          )}
        </section>

        <section className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <h2 className="text-2xl font-bold text-slate-800 p-6">Cotización</h2>
            {suggestedMaterials.length > 0 && (
              <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  💡 Materiales sugeridos por IA:
                </p>
                <div className="space-y-1">
                  {suggestedMaterials.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600">
                      <span>{s.legacyCode} — {s.reason}</span>
                      <span className="font-medium">×{s.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th className="px-6 py-3">Material</th>
                    <th className="px-6 py-3 text-right">Precio Unit.</th>
                    <th className="px-6 py-3 text-center">Cantidad</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.materialId} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.name}<br /><span className="text-xs text-slate-500">{item.unit}</span></td>
                      <td className="px-6 py-4 text-right">
                        Q{Number(item.unitPriceGtq).toFixed(2)}
                        <div className="text-[11px] text-slate-400">IVA incluido</div>
                      </td>
                      <td className="px-6 py-4 text-center">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-semibold">Q{(Number(item.unitPriceGtq) * item.quantity).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => removeMaterial(item.materialId)} className="text-red-500 hover:text-red-700">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-center text-slate-500" colSpan={5}>Tu cotización está vacía.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Agregar Material</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} className="p-3 bg-slate-50 border rounded-lg md:col-span-2">
                <option value="">-- Selecciona un material --</option>
                {allMaterials.map(material => (
                  <option key={material.id} value={material.id}>{material.name} ({material.unit})</option>
                ))}
              </select>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="p-3 bg-slate-50 border rounded-lg" />
            </div>
            <button onClick={addMaterial} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">Agregar a la Cotización</button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Resumen de Costos</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-600"><span>Subtotal (con IVA incluido):</span><span className="font-medium">Q{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>IVA 12% (incluido):</span><span className="font-medium">Q{iva.toFixed(2)}</span></div>
              <hr className="my-2 border-t border-slate-200" />
              <div className="flex justify-between text-slate-900 text-xl font-bold"><span>TOTAL:</span><span>Q{total.toFixed(2)}</span></div>
            </div>
            <button
              onClick={handleSaveQuotation}
              disabled={quotationSaving || cart.length === 0}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {quotationSaving ? '⏳ Guardando...' : quotationSaved ? '✅ Cotización guardada' : '💾 Guardar Cotización'}
            </button>
            {quotationError && (
              <p className="text-red-600 text-sm mt-1">{quotationError}</p>
            )}
          </div>
        </section>

        <section>
          <div ref={mapSectionRef}>
            <MapSection
              latitude={project.latitude}
              longitude={project.longitude}
              addressText={project.addressText}
              onLocationChange={handleLocationChange}
            />
          </div>
          {savingLocation && <p className="text-sm text-slate-500 mt-2">Guardando ubicación...</p>}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800">¿Necesitas Financiamiento?</h3>
            {creditSubmission ? (
              <div className="mt-4 w-full rounded-lg border border-green-200 bg-green-50 p-4 text-left">
                <p className="text-sm font-semibold text-green-700">✅ Solicitud enviada</p>
                <p className="mt-1 text-sm text-slate-700">
                  Ticket: <span className="font-bold">{creditSubmission.ticketNumber}</span>
                </p>
              </div>
            ) : (
              <button
                onClick={() => setIsCreditModalOpen(true)}
                className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700"
              >
                Solicitar Crédito
              </button>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800">¿Todo Listo?</h3>
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="mt-4 w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 disabled:bg-slate-400"
            >
              {exportingPdf ? '⏳ Exportando PDF...' : 'Exportar a PDF'}
            </button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800">¿Quieres Empezar de Nuevo?</h3>
            <button onClick={() => setCart([])} className="mt-4 w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600">Limpiar Cotización</button>
          </div>
        </section>

      </main>

      <CreditRequestModal
        isOpen={isCreditModalOpen}
        projectId={project.id}
        onClose={() => setIsCreditModalOpen(false)}
        onSubmitted={(submission) => {
          setCreditSubmission(submission);
          setIsCreditModalOpen(false);
        }}
      />
      <ChatTab projectId={project.id} onGeneratePlan={handleGeneratePlan} />
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={(
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Cargando...
      </div>
    )}
    >
      <ProjectPageContent />
    </Suspense>
  );
}
