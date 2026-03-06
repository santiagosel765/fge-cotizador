'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ProjectStatus } from '@/types/project.types';
import { ProjectRecord, projectsService } from '@/services/projects.service';
import {
  Archive, ExternalLink, Eye,
  LayoutDashboard, Calculator, FileText, MapPin,
  UserCircle, Bot, PlusCircle, Plus,
} from 'lucide-react';

const statusOptions: Array<{ value: 'all' | ProjectStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Draft' },
  { value: 'planned', label: 'Planned' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'credit_requested', label: 'Credit Requested' },
  { value: 'archived', label: 'Archived' },
];

const technicalAssetTypes = ['blueprint', 'acotado', 'electrico', 'fuerza', 'hidraulico', 'drenajes', 'cimentaciones'];


function badgeClass(status: ProjectStatus): string {
  if (status === 'planned') return 'bg-blue-100 text-blue-700';
  if (status === 'quoted') return 'bg-emerald-100 text-emerald-700';
  if (status === 'credit_requested') return 'bg-amber-100 text-amber-700';
  if (status === 'archived') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-700';
}

function formatStatus(status: ProjectStatus): string {
  return status.replace('_', ' ');
}

function truncate(text: string | null | undefined, max = 60): string {
  if (!text) return 'Sin descripción';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function formatMoney(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return 'Sin cotizar';
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
}

function getBlueprintCount(project: ProjectRecord): number {
  const assets = project.aiAssets ?? [];
  const unique = new Set(
    assets
      .map((asset) => asset.assetType?.toLowerCase())
      .filter((type) => type && technicalAssetTypes.includes(type)),
  );
  return unique.size;
}

function latestQuotationTotal(project: ProjectRecord): number | undefined {
  const quotations = project.quotations ?? [];
  if (quotations.length === 0) return undefined;
  const q = quotations[quotations.length - 1];
  if (!q) return undefined;
  const materials = Number(q.subtotalGtq ?? 0);
  const labor = Number(q.laborGtq ?? 0);
  return materials + labor;
}

export default function AdminProjectsPage(): JSX.Element {
  const { token } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [modalTab, setModalTab] = useState<
    'resumen' | 'cotizacion' | 'planos' | 'ubicacion'
  >('resumen');

  async function loadProjects(): Promise<void> {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsService.listProjects({}, token);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los proyectos');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [projects, search, statusFilter]);

  async function handleArchive(projectId: string): Promise<void> {
    if (!token) return;
    try {
      await projectsService.updateProjectStatus(projectId, 'archived', token);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo archivar el proyecto');
    }
  }

  async function handleStatusChange(projectId: string, status: ProjectStatus): Promise<void> {
    if (!token) return;
    try {
      const updated = await projectsService.updateProjectStatus(projectId, status, token);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? { ...project, ...updated } : project)));
      setSelectedProject((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado');
    }
  }

  async function openProjectModal(projectId: string): Promise<void> {
    if (!token) return;
    try {
      const project = await projectsService.getProject(projectId, token);
      setSelectedProject(project);
      setModalTab('resumen');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle del proyecto');
    }
  }

  return (
    <main className="space-y-4">
      <header className="rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Proyectos</h1>
        <p className="text-sm text-slate-600">Revisa, filtra y administra el estado de todos los proyectos.</p>
      </header>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); }}
            placeholder="Buscar por nombre de proyecto"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 md:max-w-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value as 'all' | ProjectStatus); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        {error ? <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="px-2 py-2">Proyecto</th>
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Ubicación</th>
                <th className="px-2 py-2">Planos</th>
                <th className="px-2 py-2">Cotización</th>
                <th className="px-2 py-2">Creado</th>
                <th className="px-2 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-2 py-4 text-slate-500" colSpan={8}>Cargando proyectos...</td></tr>
              ) : filteredProjects.length === 0 ? (
                <tr><td className="px-2 py-4 text-slate-500" colSpan={8}>No hay proyectos para los filtros seleccionados.</td></tr>
              ) : filteredProjects.map((project) => (
                <tr key={project.id} className="border-b align-top">
                  <td className="px-2 py-2">
                    <p className="font-semibold text-slate-800">{project.name}</p>
                    <p className="text-xs text-slate-500">{truncate(project.userDescription)}</p>
                  </td>
                  <td className="px-2 py-2">
                    <p className="text-slate-800 font-medium">
                      {project.user?.fullName ?? 'Sin nombre'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {project.user?.email ?? project.userId}
                    </p>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${badgeClass(project.status)}`}>
                      {formatStatus(project.status)}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-slate-600">{project.addressText ?? 'Sin ubicación'}</td>
                  <td className="px-2 py-2 text-slate-600">{getBlueprintCount(project)}/7</td>
                  <td className="px-2 py-2 text-slate-600">{formatMoney(latestQuotationTotal(project))}</td>
                  <td className="px-2 py-2 text-slate-600">{new Date(project.createdAt).toLocaleDateString('es-GT')}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-100"
                      >
                        <ExternalLink size={15} />
                        Abrir
                      </Link>
                      <button
                        type="button"
                        onClick={() => { void openProjectModal(project.id); }}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-100"
                      >
                        <Eye size={15} />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => { void handleArchive(project.id); }}
                        className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50"
                      >
                        <Archive size={15} />
                        Archivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedProject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            {/* Header del modal */}
            <div className="flex items-start justify-between gap-3 bg-slate-900 text-white px-5 py-4 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{selectedProject.userDescription}</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                onClick={() => setSelectedProject(null)}
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            {/* Tabs del modal */}
            <div className="flex border-b bg-white flex-shrink-0">
              {[
                { id: 'resumen', label: 'Resumen', Icon: LayoutDashboard },
                { id: 'cotizacion', label: 'Cotización', Icon: Calculator },
                { id: 'planos', label: 'Planos', Icon: FileText },
                { id: 'ubicacion', label: 'Ubicación', Icon: MapPin },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setModalTab(id as typeof modalTab)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenido scrollable */}
            <div className="overflow-y-auto flex-1 p-5">
              {modalTab === 'resumen' && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Estado del proyecto</p>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClass(selectedProject.status)}`}>
                        {formatStatus(selectedProject.status)}
                      </span>
                      <select
                        className="rounded border border-slate-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        value={selectedProject.status}
                        onChange={(e) => {
                          void handleStatusChange(selectedProject.id, e.target.value as ProjectStatus);
                        }}
                      >
                        {statusOptions.filter((item) => item.value !== 'all').map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                      <span className="flex items-center gap-1.5">
                        <UserCircle size={14} /> Cliente
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        ['Nombre', selectedProject.user?.fullName ?? 'No disponible'],
                        ['Email', selectedProject.user?.email ?? 'No disponible'],
                        ['Teléfono', selectedProject.user?.phone ?? 'No registrado'],
                        ['Rol', selectedProject.user?.role ?? 'client'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="font-medium text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(selectedProject as ProjectRecord & {
                    plannerProjectType?: string;
                    plannerDimensions?: string;
                    plannerMainSpaces?: string;
                    plannerKeyMaterials?: string;
                  }).plannerProjectType && (
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Bot size={14} /> Datos del planificador IA
                        </span>
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {[
                          ['Tipo de proyecto', (selectedProject as ProjectRecord & { plannerProjectType?: string }).plannerProjectType],
                          ['Dimensiones', (selectedProject as ProjectRecord & { plannerDimensions?: string }).plannerDimensions || 'No especificadas'],
                          ['Espacios principales', (selectedProject as ProjectRecord & { plannerMainSpaces?: string }).plannerMainSpaces || 'No especificados'],
                          ['Materiales preferidos', (selectedProject as ProjectRecord & { plannerKeyMaterials?: string }).plannerKeyMaterials || 'No especificados'],
                        ].map(([label, value]) => value && (
                          <div key={label} className="flex gap-2 py-1 border-b border-slate-100">
                            <span className="text-slate-400 w-36 flex-shrink-0">{label}</span>
                            <span className="text-slate-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Fechas</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Creado</p>
                        <p className="font-medium">{new Date(selectedProject.createdAt).toLocaleDateString('es-GT')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Actualizado</p>
                        <p className="font-medium">{new Date(selectedProject.updatedAt ?? selectedProject.createdAt).toLocaleDateString('es-GT')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'cotizacion' && (
                <div className="space-y-4">
                  {(selectedProject.quotations?.length ?? 0) === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Calculator size={32} className="mx-auto mb-2 opacity-30" />
                      <p>Sin cotización registrada</p>
                    </div>
                  ) : (() => {
                    const q = selectedProject.quotations![selectedProject.quotations!.length - 1]!;
                    const laborGtq = Number(q.laborGtq ?? 0);
                    const laborPct = q.laborPct ? Number(q.laborPct) * 100 : 0;
                    const grandTotal = Number(q.subtotalGtq) + laborGtq;
                    const laborLabels: Record<string, string> = {
                      economica: 'Vivienda economica',
                      media: 'Vivienda media',
                      ampliacion: 'Ampliacion',
                      obra_gris: 'Obra gris',
                    };

                    return (
                      <div className="space-y-4">
                        <div className="rounded-lg border p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Resumen financiero</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-600">
                              <span>Subtotal materiales (IVA incl.)</span>
                              <span className="font-medium">Q {Number(q.subtotalGtq).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {laborGtq > 0 && (
                              <div className="flex justify-between text-slate-600">
                                <span>Mano de obra — {laborLabels[q.laborProjectType ?? ''] ?? q.laborProjectType} ({laborPct.toFixed(0)}%)</span>
                                <span className="font-medium">Q {laborGtq.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-900 border-t pt-2">
                              <span>TOTAL GENERAL</span>
                              <span>Q {grandTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        {(q.items?.length ?? 0) > 0 && (
                          <div className="rounded-lg border p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Materiales ({q.items!.length} items)</p>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {q.items!.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100">
                                  <span className="text-slate-700 flex-1 mr-2">{item.material?.name ?? 'Material'}</span>
                                  <span className="text-slate-400 mr-3 w-16 text-right">{Number(item.quantity)} {item.material?.unit}</span>
                                  <span className="font-medium text-slate-800 w-24 text-right">Q {Number(item.subtotalGtq).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-400 text-right">Versión {q.versionNumber} · Guardada el {new Date(q.createdAt ?? selectedProject.createdAt).toLocaleDateString('es-GT')}</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {modalTab === 'planos' && (
                <div className="space-y-3">
                  {[
                    { label: 'Arquitectónico', keys: ['blueprint', 'arquitectonico'] },
                    { label: 'Acotado', keys: ['acotado'] },
                    { label: 'Eléctrico', keys: ['electrico'] },
                    { label: 'Fuerza 220V', keys: ['fuerza'] },
                    { label: 'Hidráulico', keys: ['hidraulico'] },
                    { label: 'Drenajes', keys: ['drenajes'] },
                    { label: 'Cimentaciones', keys: ['cimentaciones'] },
                  ].map((item) => {
                    const hasAsset = (selectedProject.aiAssets ?? []).some((a) => item.keys.includes(a.assetType?.toLowerCase() ?? ''));
                    return (
                      <div key={item.label} className={`flex items-center justify-between rounded-lg border p-3 ${hasAsset ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          {hasAsset
                            ? <PlusCircle size={16} className="text-green-600" />
                            : <Plus size={16} className="text-slate-300" />}
                          <span className={`text-sm font-medium ${hasAsset ? 'text-green-800' : 'text-slate-500'}`}>{item.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${hasAsset ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                          {hasAsset ? 'Generado' : 'Pendiente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {modalTab === 'ubicacion' && (
                <div className="space-y-4">
                  {selectedProject.addressText ? (
                    <div className="rounded-lg border p-4 space-y-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dirección registrada</p>
                      <p className="text-slate-800 font-medium">{selectedProject.addressText}</p>
                      {selectedProject.latitude && (
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          <div>
                            <p className="text-xs text-slate-400">Latitud</p>
                            <p>{selectedProject.latitude}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Longitud</p>
                            <p>{selectedProject.longitude}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                      <p>Sin ubicación registrada</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t p-4 flex-shrink-0 bg-white">
              <Link
                href={`/projects/${selectedProject.id}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                <ExternalLink size={15} />
                Abrir y editar proyecto completo
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
