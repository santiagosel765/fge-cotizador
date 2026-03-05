'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ProjectStatus } from '@/types/project.types';
import { ProjectRecord, projectsService } from '@/services/projects.service';

const statusOptions: Array<{ value: 'all' | ProjectStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Draft' },
  { value: 'planned', label: 'Planned' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'credit_requested', label: 'Credit Requested' },
  { value: 'archived', label: 'Archived' },
];

const technicalAssetTypes = ['blueprint', 'acotado', 'electrico', 'fuerza', 'hidraulico', 'drenajes', 'cimentaciones'];

const detailedBlueprints: Array<{ label: string; keys: string[] }> = [
  { label: 'Arquitectónico', keys: ['blueprint', 'arquitectonico'] },
  { label: 'Acotado', keys: ['acotado', 'plano_acotado'] },
  { label: 'Eléctrico', keys: ['electrico', 'plano_electrico'] },
  { label: 'Fuerza', keys: ['fuerza', 'plano_fuerza'] },
  { label: 'Hidráulico', keys: ['hidraulico', 'plano_hidraulico'] },
  { label: 'Drenajes', keys: ['drenajes', 'plano_drenajes'] },
  { label: 'Cimentaciones', keys: ['cimentaciones', 'plano_cimentaciones'] },
];

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

function formatMoney(value?: number): string {
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
  return quotations[quotations.length - 1]?.totalGtq;
}

export default function AdminProjectsPage(): JSX.Element {
  const { token } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

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
                  <td className="px-2 py-2 text-slate-600">{project.user?.email ?? project.user?.fullName ?? project.userId}</td>
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
                      <button type="button" onClick={() => { void openProjectModal(project.id); }} className="rounded border px-2 py-1 hover:bg-slate-100">👁️ Ver</button>
                      <button type="button" onClick={() => { void handleArchive(project.id); }} className="rounded border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50">🗑️ Archivar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedProject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedProject.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedProject.userDescription}</p>
              </div>
              <button type="button" className="rounded border px-2 py-1" onClick={() => { setSelectedProject(null); }}>Cerrar</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="font-semibold text-slate-800">Estado actual</p>
                <select
                  className="mt-2 rounded border border-slate-300 px-3 py-2"
                  value={selectedProject.status}
                  onChange={(event) => { void handleStatusChange(selectedProject.id, event.target.value as ProjectStatus); }}
                >
                  {statusOptions.filter((item) => item.value !== 'all').map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border p-3">
                <p className="font-semibold text-slate-800">Cliente</p>
                <p>ID: {selectedProject.userId}</p>
                <p>Email/Nombre: {selectedProject.user?.email ?? selectedProject.user?.fullName ?? 'No disponible'}</p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="font-semibold text-slate-800">Ubicación</p>
                <p>{selectedProject.addressText ?? 'Sin ubicación'}</p>
                {(selectedProject.latitude !== null && selectedProject.latitude !== undefined && selectedProject.longitude !== null && selectedProject.longitude !== undefined) ? (
                  <p className="text-slate-600">Lat: {selectedProject.latitude}, Lng: {selectedProject.longitude}</p>
                ) : null}
              </div>

              <div className="rounded-lg border p-3">
                <p className="font-semibold text-slate-800">Planos generados</p>
                <ul className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
                  {detailedBlueprints.map((item) => {
                    const hasAsset = (selectedProject.aiAssets ?? []).some((asset) => item.keys.includes(asset.assetType?.toLowerCase()));
                    return <li key={item.label}>{hasAsset ? '✓' : '○'} {item.label}</li>;
                  })}
                </ul>
              </div>

              <div className="rounded-lg border p-3">
                <p className="font-semibold text-slate-800">Resumen de cotización</p>
                {(selectedProject.quotations?.length ?? 0) > 0 ? (
                  (() => {
                    const quotation = selectedProject.quotations![selectedProject.quotations!.length - 1]!;
                    return (
                      <div className="mt-1 space-y-1">
                        <p>Subtotal: {formatMoney(quotation.subtotalGtq)}</p>
                        <p>IVA: {formatMoney(quotation.ivaGtq)}</p>
                        <p>Total: {formatMoney(quotation.totalGtq)}</p>
                      </div>
                    );
                  })()
                ) : <p className="text-slate-600">Sin cotizar</p>}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link href={`/projects/${selectedProject.id}`} className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
                Abrir Proyecto Completo
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
