'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Project } from '@/types/project';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [userDescription, setUserDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const project = await api.post<Project>('/projects', { name, userDescription });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
          <p className="text-gray-500 text-sm mt-1">
            Describe tu vivienda y el asistente IA elaborará el plan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Casa de 2 habitaciones Zona 6"
              required
              minLength={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe tu proyecto
            </label>
            <textarea
              value={userDescription}
              onChange={e => setUserDescription(e.target.value)}
              placeholder="Ej: Quiero una vivienda de 60m2 con sala, cocina, 2 habitaciones y 1 baño. Presupuesto aproximado Q150,000."
              required
              minLength={10}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creando proyecto...' : 'Crear proyecto'}
          </button>
        </form>
      </div>
    </main>
  );
}
