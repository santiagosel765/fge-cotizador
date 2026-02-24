'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Project } from '@/types/project';

interface Question {
  question: string;
  yesAction: (prev: FormFields) => Partial<FormFields>;
  noAction: (prev: FormFields) => Partial<FormFields>;
}

interface FormFields {
  projectType: string;
  dimensions: string;
  spaces: string;
  materials: string;
  details: string;
}

const QUESTIONS: Question[] = [
  {
    question: '¿Tu proyecto es para una vivienda de un solo nivel?',
    yesAction: () => ({ projectType: 'Vivienda de un solo nivel' }),
    noAction: () => ({ projectType: 'Vivienda de dos niveles' }),
  },
  {
    question: '¿Necesitas 2 o más dormitorios?',
    yesAction: (prev) => ({ spaces: prev.spaces ? `${prev.spaces}, 2 dormitorios` : '2 dormitorios' }),
    noAction: (prev) => ({ spaces: prev.spaces ? `${prev.spaces}, 1 dormitorio` : '1 dormitorio' }),
  },
  {
    question: '¿Incluirá baño completo?',
    yesAction: (prev) => ({ spaces: prev.spaces ? `${prev.spaces}, 1 baño completo` : '1 baño completo' }),
    noAction: (prev) => ({ spaces: prev.spaces ? `${prev.spaces}, medio baño` : 'medio baño' }),
  },
  {
    question: '¿Prefieres techo de lámina para optimizar costos?',
    yesAction: (prev) => ({ materials: prev.materials ? `${prev.materials}, techo de lámina` : 'techo de lámina' }),
    noAction: (prev) => ({ materials: prev.materials ? `${prev.materials}, techo de losa` : 'techo de losa' }),
  },
  {
    question: '¿Usarás block de cemento en las paredes?',
    yesAction: (prev) => ({ materials: prev.materials ? `${prev.materials}, paredes de block` : 'paredes de block' }),
    noAction: (prev) => ({ materials: prev.materials ? `${prev.materials}, paredes de ladrillo` : 'paredes de ladrillo' }),
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [fields, setFields] = useState<FormFields>({
    projectType: '',
    dimensions: '',
    spaces: '',
    materials: '',
    details: '',
  });
  const [assistantStep, setAssistantStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleAnswer(action: (prev: FormFields) => Partial<FormFields>) {
    setFields(prev => ({ ...prev, ...action(prev) }));
    setAssistantStep(prev => prev + 1);
  }

  function handleFieldChange(field: keyof FormFields, value: string) {
    setFields(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.projectType.trim()) {
      setError('El tipo de proyecto es requerido.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const descParts = [
        fields.dimensions && `Dimensiones: ${fields.dimensions}`,
        fields.spaces && `Espacios: ${fields.spaces}`,
        fields.materials && `Materiales: ${fields.materials}`,
        fields.details && `Detalles adicionales: ${fields.details}`,
      ].filter(Boolean);

      const userDescription = descParts.length > 0
        ? descParts.join('. ')
        : fields.projectType;

      const project = await api.post<Project>('/projects', {
        name: fields.projectType,
        userDescription,
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = QUESTIONS[assistantStep] ?? null;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 py-8 rounded-b-2xl shadow-lg mx-4 mt-4">
        <h1 className="text-3xl font-extrabold">Planifica tu Proyecto con IA</h1>
        <p className="text-blue-200 mt-1 text-sm">
          Describe tu obra por secciones o usa las preguntas guía del asistente.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: formulario */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Tipo de Proyecto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fields.projectType}
                    onChange={e => handleFieldChange('projectType', e.target.value)}
                    placeholder="Ej: Vivienda, ampliación, muro"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Dimensiones Generales
                  </label>
                  <input
                    type="text"
                    value={fields.dimensions}
                    onChange={e => handleFieldChange('dimensions', e.target.value)}
                    placeholder="Ej: 8×10 metros, 70m²"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Espacios Principales <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fields.spaces}
                  onChange={e => handleFieldChange('spaces', e.target.value)}
                  placeholder="Ej: 2 dormitorios, 1 baño, sala-comedor"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Materiales Clave
                </label>
                <input
                  type="text"
                  value={fields.materials}
                  onChange={e => handleFieldChange('materials', e.target.value)}
                  placeholder="Ej: Block, lámina, piso cerámico"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Detalles Adicionales
                </label>
                <textarea
                  value={fields.details}
                  onChange={e => handleFieldChange('details', e.target.value)}
                  placeholder="Ej: Acabados sencillos y patio pequeño"
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition resize-none"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Columna derecha: Asistente interactivo */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 h-fit">
              <div>
                <h3 className="text-lg font-bold text-slate-800">🏗️ Asistente de Diseño</h3>
                <p className="text-xs text-slate-500 mt-0.5">Responde para definir tu proyecto.</p>
              </div>

              {currentQuestion ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 leading-snug">
                    {currentQuestion.question}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.yesAction)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-colors"
                    >
                      ✓ Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.noAction)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-colors"
                    >
                      ✗ No
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Pregunta {assistantStep + 1} de {QUESTIONS.length}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2 py-2">
                  <span className="text-3xl">✅</span>
                  <p className="text-sm text-green-700 font-semibold">¡Proyecto definido!</p>
                  <p className="text-xs text-slate-500">
                    Revisa los campos y haz clic en Generar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            {loading ? '⏳ Creando proyecto...' : '✨ Generar Proyecto con IA'}
          </button>
        </form>
      </div>
    </div>
  );
}
