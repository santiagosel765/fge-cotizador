'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { LaborConfig, laborConfigService } from '@/services/labor-config.service';

export default function AdminLaborPage(): JSX.Element {
  const { token } = useAuth();
  const [configs, setConfigs] = useState<LaborConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPercentage, setEditingPercentage] = useState<string>('0');
  const [updatedId, setUpdatedId] = useState<string | null>(null);

  async function loadConfigs(): Promise<void> {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await laborConfigService.listConfigs(token);
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la configuración de mano de obra');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadConfigs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSave(configId: string): Promise<void> {
    if (!token) return;

    const normalized = Number(editingPercentage) / 100;
    if (!Number.isFinite(normalized) || normalized < 0 || normalized > 1) {
      setError('El porcentaje debe estar entre 0 y 100');
      return;
    }

    setError(null);

    try {
      const updated = await laborConfigService.updateConfig(configId, normalized, token);
      setConfigs((prev) => prev.map((config) => (config.id === configId ? updated : config)));
      setEditingId(null);
      setUpdatedId(configId);
      setTimeout(() => {
        setUpdatedId((current) => (current === configId ? null : current));
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la configuración');
    }
  }

  return (
    <main className="space-y-4">
      <header className="rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">👷 Configuración de Mano de Obra</h1>
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Los porcentajes se aplican sobre el subtotal de materiales (IVA incluido).
          Fuente de referencia: mercado guatemalteco de construcción.
        </p>
      </header>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        {error ? <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {isLoading ? <p className="text-slate-600">Cargando configuración...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 font-semibold">Label</th>
                  <th className="px-3 py-2 font-semibold">Porcentaje actual</th>
                  <th className="px-3 py-2 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => {
                  const isEditing = editingId === config.id;
                  return (
                    <tr key={config.id} className="border-b">
                      <td className="px-3 py-2 text-slate-700">{config.projectType}</td>
                      <td className="px-3 py-2 text-slate-700">{config.label}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={editingPercentage}
                              onChange={(event) => { setEditingPercentage(event.target.value); }}
                              className="w-28 rounded border border-slate-300 px-2 py-1"
                            />
                            <span>%</span>
                          </div>
                        ) : `${(Number(config.percentage) * 100).toFixed(2)}%`}
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => { void handleSave(config.id); }} className="rounded bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-500">Guardar</button>
                            <button type="button" onClick={() => { setEditingId(null); setError(null); }} className="rounded border px-2 py-1 hover:bg-slate-100">Cancelar</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(config.id);
                                setEditingPercentage((Number(config.percentage) * 100).toString());
                                setError(null);
                              }}
                              className="rounded border px-2 py-1 hover:bg-slate-100"
                            >
                              ✏️ Editar
                            </button>
                            {updatedId === config.id ? <span className="text-emerald-700">✓ Actualizado</span> : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
