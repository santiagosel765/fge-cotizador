'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Project } from '@/types/project';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    projectType: '',
    dimensions: '',
    mainSpaces: '',
    keyMaterials: '',
    additionalDetails: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.projectType.trim() || !formData.mainSpaces.trim()) {
      setError('Completa al menos Tipo de Proyecto y Espacios Principales.');
      return;
    }

    setLoading(true);
    setError('');

    const userDescription = [
      `Tipo de proyecto: ${formData.projectType}.`,
      `Dimensiones generales: ${formData.dimensions || 'No especificadas'}.`,
      `Espacios principales: ${formData.mainSpaces}.`,
      `Materiales clave: ${formData.keyMaterials || 'No especificados'}.`,
      `Detalles adicionales: ${formData.additionalDetails || 'Ninguno'}.`,
    ].join(' ');

    try {
      const project = await api.post<Project>('/projects', {
        name: formData.projectType,
        userDescription,
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition';

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">Planifica tu Proyecto con IA</h1>
          <p className="mt-2 text-blue-200">
            Describe tu obra por secciones o usa las preguntas guía del asistente.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-2/3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Proyecto *</label>
                  <input name="projectType" value={formData.projectType} onChange={handleInputChange} className={inputClass} placeholder="Ej: Vivienda, ampliación, muro" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Dimensiones Generales</label>
                  <input name="dimensions" value={formData.dimensions} onChange={handleInputChange} className={inputClass} placeholder="Ej: 8x10 metros, 70m²" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Espacios Principales *</label>
                <input name="mainSpaces" value={formData.mainSpaces} onChange={handleInputChange} className={inputClass} placeholder="Ej: 2 dormitorios, 1 baño, sala-comedor" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Materiales Clave</label>
                <input name="keyMaterials" value={formData.keyMaterials} onChange={handleInputChange} className={inputClass} placeholder="Ej: Block, lámina, piso cerámico" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Detalles Adicionales</label>
                <textarea name="additionalDetails" rows={4} value={formData.additionalDetails} onChange={handleInputChange} className={inputClass} placeholder="Ej: Acabados sencillos y patio pequeño" />
              </div>
            </div>

            <aside className="lg:w-1/3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <h3 className="text-lg font-bold text-slate-800">Asistente de Diseño</h3>
              <p className="text-sm text-slate-500 mt-1">Preguntas guía para aterrizar tu idea:</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li>• ¿Tu proyecto es de un solo nivel? (Sí/No)</li>
                <li>• ¿Necesitas 2 o más dormitorios? (Sí/No)</li>
                <li>• ¿Incluirá baño completo? (Sí/No)</li>
                <li>• ¿Prefieres techo de lámina para optimizar costos? (Sí/No)</li>
                <li>• ¿Usarás block de cemento en paredes? (Sí/No)</li>
              </ul>
            </aside>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            {loading ? 'Generando...' : 'Generar Proyecto con IA'}
          </button>
        </form>
      </div>
    </main>
  );
}
