'use client';

import { useState } from 'react';
import { Archive, Bot, Plus, PlusCircle } from 'lucide-react';

interface EstudioSueloSectionProps {
  projectId: string;
}

const REQUISITOS = [
  { id: 'ensayo_compresion', label: 'Ensayo de compresión triaxial' },
  { id: 'capacidad_soporte', label: 'Capacidad soporte del suelo (ton/m²)' },
  { id: 'nivel_freatico', label: 'Nivel freático identificado' },
  { id: 'clasificacion_suelo', label: 'Clasificación SUCS del suelo' },
  { id: 'recomendacion_cimentacion', label: 'Recomendación de tipo de cimentación' },
];

export function EstudioSueloSection({ projectId }: EstudioSueloSectionProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hasStudy, setHasStudy] = useState<boolean | null>(null);

  const completedCount = Object.values(checked).filter(Boolean).length;
  const allComplete = completedCount === REQUISITOS.length;

  return (
    <section data-project-id={projectId} className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-6 py-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2"><Bot size={20} /> Estudio de Suelo</h2>
        <p className="text-amber-200 text-sm mt-1">
          Requisito técnico previo a la construcción — norma AGIES Guatemala
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            ¿El terreno ya cuenta con estudio de suelo?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setHasStudy(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-colors ${hasStudy === true
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-300 text-slate-600 hover:border-green-400'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><Plus size={15} /> Sí, tengo el estudio</span>
            </button>
            <button
              onClick={() => setHasStudy(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-colors ${hasStudy === false
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'border-slate-300 text-slate-600 hover:border-amber-400'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><Archive size={15} /> Aún no lo tengo</span>
            </button>
          </div>
        </div>

        {hasStudy === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              <span className="flex items-center gap-2"><Archive size={15} /> El estudio de suelo es obligatorio según AGIES NSE 2-10</span>
            </p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Costo estimado en Guatemala: <strong>Q 3,500 – Q 8,000</strong></li>
              <li>• Tiempo: 5 a 10 días hábiles</li>
              <li>• Lo realiza un laboratorio de suelos certificado</li>
              <li>• Fundación Génesis puede orientarte con laboratorios aliados</li>
            </ul>
            <p className="text-xs text-amber-600 mt-3">
              Sin este documento, el municipio no aprueba la licencia de construcción.
            </p>
          </div>
        )}

        {hasStudy === true && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Verifica que el estudio incluya:
            </p>
            <div className="space-y-2">
              {REQUISITOS.map((req) => (
                <label key={req.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked[req.id] ?? false}
                    onChange={(e) => setChecked((prev) => ({
                      ...prev,
                      [req.id]: e.target.checked,
                    }))}
                    className="w-4 h-4 rounded border-slate-300 text-green-600 cursor-pointer"
                  />
                  <span className={`text-sm ${checked[req.id]
                    ? 'line-through text-slate-400'
                    : 'text-slate-600'}`}
                  >
                    {req.label}
                  </span>
                </label>
              ))}
            </div>
            {allComplete && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <span className="text-green-700 font-semibold text-sm">
                  <span className="flex items-center justify-center gap-2"><PlusCircle size={15} /> Estudio de suelo completo — listo para solicitar licencia</span>
                </span>
              </div>
            )}
            {!allComplete && completedCount > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                {completedCount}/{REQUISITOS.length} elementos verificados
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
