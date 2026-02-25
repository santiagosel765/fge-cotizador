'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { MaterialCategory, Project } from '@/types/project';
import MapSection from './components/MapSection';
import ChatTab from './components/ChatTab';

interface CartItem {
  materialId: string;
  name: string;
  unit: string;
  unitPriceGtq: number;
  quantity: number;
}

const IVA_RATE = 0.12;

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
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
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [quotationSaved, setQuotationSaved] = useState(false);
  const [quotationError, setQuotationError] = useState('');

  const [planner, setPlanner] = useState({
    projectType: '',
    dimensions: '',
    mainSpaces: '',
    keyMaterials: '',
    additionalDetails: '',
  });

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
          additionalDetails: projectData.userDescription ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const allMaterials = useMemo(() => categories.flatMap(category => category.materials ?? []), [categories]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.unitPriceGtq * item.quantity, 0), [cart]);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  async function handleGeneratePlan() {
    if (!project) return;

    setPlanLoading(true);
    setPlanError('');

    const userDescription = [
      `Tipo de proyecto: ${planner.projectType}.`,
      `Dimensiones generales: ${planner.dimensions || 'No especificadas'}.`,
      `Espacios principales: ${planner.mainSpaces || 'No especificados'}.`,
      `Materiales clave: ${planner.keyMaterials || 'No especificados'}.`,
      `Detalles adicionales: ${planner.additionalDetails || 'Ninguno'}.`,
    ].join(' ');

    try {
      const patchedProject = await api.patch<Project>(`/projects/${project.id}`, {
        name: planner.projectType || project.name,
        userDescription,
      });
      setProject(patchedProject);

      const result = await api.post<{
        detailedConcept: string;
        blueprintSvg: string;
        suggestedMaterials: Array<{ legacyCode: string; quantity: number; reason: string }>;
      }>('/ai/plan', { projectId: project.id });

      setBlueprintSvg(result.blueprintSvg ?? '');
      setDetailedConcept(result.detailedConcept ?? '');
      setSuggestedMaterials(result.suggestedMaterials ?? []);

      const updated = await api.get<Project>(`/projects/${project.id}`);
      setProject(updated);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Error generando plan');
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
          unitPriceGtq: material.unitPriceGtq,
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

  if (loading || !project) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando proyecto...</div>;
  }

  const render = project.aiAssets?.find(a => a.assetType === 'render')?.storageUrl;
  const pano = project.aiAssets?.find(a => a.assetType === 'panorama')?.storageUrl;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{project.name}</h1>
          <p className="mt-2 text-blue-200">{project.userDescription}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl">
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Planificador IA</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <input className="w-full p-3 bg-slate-50 border rounded-lg" placeholder="Tipo de proyecto" value={planner.projectType} onChange={e => setPlanner(prev => ({ ...prev, projectType: e.target.value }))} />
              <input className="w-full p-3 bg-slate-50 border rounded-lg" placeholder="Dimensiones generales" value={planner.dimensions} onChange={e => setPlanner(prev => ({ ...prev, dimensions: e.target.value }))} />
              <input className="w-full p-3 bg-slate-50 border rounded-lg" placeholder="Espacios principales" value={planner.mainSpaces} onChange={e => setPlanner(prev => ({ ...prev, mainSpaces: e.target.value }))} />
              <input className="w-full p-3 bg-slate-50 border rounded-lg" placeholder="Materiales clave" value={planner.keyMaterials} onChange={e => setPlanner(prev => ({ ...prev, keyMaterials: e.target.value }))} />
              <textarea className="w-full p-3 bg-slate-50 border rounded-lg" rows={4} placeholder="Detalles adicionales" value={planner.additionalDetails} onChange={e => setPlanner(prev => ({ ...prev, additionalDetails: e.target.value }))} />
            </div>
            <aside className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <h3 className="text-lg font-bold">Asistente de Diseño</h3>
              <ul className="mt-3 text-sm space-y-2 text-slate-600">
                <li>• ¿Proyecto de un nivel? Sí / No</li>
                <li>• ¿2 dormitorios o más? Sí / No</li>
                <li>• ¿Incluye baño completo? Sí / No</li>
                <li>• ¿Usar techo de lámina? Sí / No</li>
              </ul>
            </aside>
          </div>
          <button
            onClick={handleGeneratePlan}
            disabled={planLoading}
            className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {planLoading ? '⏳ Generando plan con IA...' : '🔄 Regenerar con IA'}
          </button>
          {planError && (
            <p className="text-red-600 text-sm mt-2">{planError}</p>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">📐 Plano Arquitectónico 2D</h2>
          {/* Área del plano */}
          {blueprintSvg ? (
            <div
              className="w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2"
              dangerouslySetInnerHTML={{ __html: blueprintSvg }}
            />
          ) : project.aiAssets?.find(a => a.assetType === 'blueprint')?.storageUrl ? (
            <div
              className="w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2"
              dangerouslySetInnerHTML={{
                __html: project.aiAssets.find(a => a.assetType === 'blueprint')!.storageUrl ?? '',
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-slate-100 rounded-lg">
              <p className="text-slate-400 text-sm">Genera tu proyecto con IA para ver el plano</p>
            </div>
          )}
          {detailedConcept && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Concepto del Proyecto</h4>
              <p className="text-sm text-slate-700 whitespace-pre-line">{detailedConcept}</p>
            </div>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">🖼️ Render Fotorrealista</h2>
          {render ? <img src={render} alt="Render" className="w-full rounded-lg" /> : <div className="h-72 bg-slate-200 rounded-lg" />}
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">🌐 Tour Virtual 360°</h2>
          {pano ? <img src={pano} alt="Tour virtual 360" className="w-full rounded-lg" /> : <div className="h-72 bg-slate-200 rounded-lg" />}
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
                      <td className="px-6 py-4 text-right">Q{item.unitPriceGtq.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-semibold">Q{(item.unitPriceGtq * item.quantity).toFixed(2)}</td>
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
              <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-medium">Q{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>IVA (12%):</span><span className="font-medium">Q{iva.toFixed(2)}</span></div>
              <hr className="my-2 border-t border-slate-200" />
              <div className="flex justify-between text-slate-900 text-xl font-bold"><span>Total Estimado:</span><span>Q{total.toFixed(2)}</span></div>
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
          <MapSection
            latitude={project.latitude}
            longitude={project.longitude}
            addressText={project.addressText}
            onLocationChange={handleLocationChange}
          />
          {savingLocation && <p className="text-sm text-slate-500 mt-2">Guardando ubicación...</p>}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800">¿Necesitas Financiamiento?</h3>
            <button className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">Solicitar Crédito</button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800">¿Todo Listo?</h3>
            <button className="mt-4 w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900">Exportar a PDF</button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800">¿Quieres Empezar de Nuevo?</h3>
            <button onClick={() => setCart([])} className="mt-4 w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600">Limpiar Cotización</button>
          </div>
        </section>

        <section>
          <ChatTab projectId={project.id} onGeneratePlan={handleGeneratePlan} />
        </section>
      </main>
    </div>
  );
}
