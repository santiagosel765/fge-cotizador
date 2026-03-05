'use client';

import { useState } from 'react';

const DEPARTAMENTOS_GT = [
  'Guatemala', 'Sacatepéquez', 'Chimaltenango', 'Escuintla',
  'Santa Rosa', 'Sololá', 'Totonicapán', 'Quetzaltenango',
  'Suchitepéquez', 'Retalhuleu', 'San Marcos', 'Huehuetenango',
  'Quiché', 'Baja Verapaz', 'Alta Verapaz', 'Petén',
  'Izabal', 'Zacapa', 'Chiquimula', 'Jalapa', 'Jutiapa',
  'El Progreso',
];

const TRAMITES = [
  {
    id: 'alineacion',
    label: 'Alineación y Rasante Municipal',
    costo: 'Q 100 – Q 500',
    plazo: '3-5 días',
    descripcion: 'Define el límite de la propiedad con la vía pública',
    requerido: true,
  },
  {
    id: 'licencia_construccion',
    label: 'Licencia de Construcción',
    costo: '1% – 3% del valor de la obra',
    plazo: '15-30 días',
    descripcion: 'Permiso principal para iniciar la obra',
    requerido: true,
  },
  {
    id: 'estudio_suelo_muni',
    label: 'Constancia de Estudio de Suelo',
    costo: 'Incluido en el estudio',
    plazo: 'Con el estudio de suelo',
    descripcion: 'Presentar el estudio de suelo ante la municipalidad',
    requerido: true,
  },
  {
    id: 'planos_aprobados',
    label: 'Aprobación de Planos',
    costo: 'Q 200 – Q 1,500',
    plazo: '10-20 días',
    descripcion: 'Los planos deben ser firmados por arquitecto o ingeniero colegiado',
    requerido: true,
  },
  {
    id: 'impuesto_obras',
    label: 'Impuesto de Obras y Construcciones',
    costo: 'Varía por municipio',
    plazo: 'Al solicitar licencia',
    descripcion: 'Pago único municipal por valor de construcción',
    requerido: true,
  },
  {
    id: 'finalizacion_obra',
    label: 'Constancia de Finalización de Obra',
    costo: 'Q 100 – Q 300',
    plazo: 'Al terminar la obra',
    descripcion: 'Inspección municipal para aprobar la obra terminada',
    requerido: false,
  },
];

export function LicenciamientoSection() {
  const [departamento, setDepartamento] = useState('');
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [totalObra, setTotalObra] = useState('');

  const completedCount = Object.values(completed).filter(Boolean).length;
  const requiredCount = TRAMITES.filter((t) => t.requerido).length;

  const totalObraNum = parseFloat(totalObra.replace(/,/g, '')) || 0;
  const licenciaEstimada = totalObraNum > 0
    ? (totalObraNum * 0.015).toLocaleString('es-GT', { minimumFractionDigits: 2 })
    : null;

  return (
    <section className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white px-6 py-5">
        <h2 className="text-xl font-extrabold">🏛️ Licenciamiento Municipal</h2>
        <p className="text-purple-200 text-sm mt-1">
          Trámites requeridos en Guatemala para legalizar tu construcción
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
              Departamento
            </label>
            <select
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="">— Seleccionar departamento —</option>
              {DEPARTAMENTOS_GT.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
              Total estimado de obra (Q)
            </label>
            <input
              type="text"
              value={totalObra}
              onChange={(e) => setTotalObra(e.target.value)}
              placeholder="Ej: 150,000"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
            {licenciaEstimada && (
              <p className="text-xs text-purple-600 mt-1">
                Licencia estimada (1.5%):
                <strong> Q {licenciaEstimada}</strong>
              </p>
            )}
          </div>
        </div>

        {departamento && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              📍 <strong>{departamento}:</strong> Los costos exactos varían por
              municipio. Consulta directamente en la municipalidad correspondiente.
              Los valores mostrados son estimados referenciales para Guatemala.
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            Trámites requeridos ({completedCount}/{requiredCount} completados)
          </p>
          <div className="space-y-3">
            {TRAMITES.map((tramite) => (
              <div
                key={tramite.id}
                className={`border rounded-lg p-4 transition-colors ${completed[tramite.id]
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-slate-200'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={completed[tramite.id] ?? false}
                    onChange={(e) => setCompleted((prev) => ({
                      ...prev,
                      [tramite.id]: e.target.checked,
                    }))}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-green-600 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${completed[tramite.id]
                        ? 'line-through text-slate-400'
                        : 'text-slate-800'}`}
                      >
                        {tramite.label}
                      </span>
                      {tramite.requerido && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          Requerido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tramite.descripcion}
                    </p>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs text-slate-600">
                        💰 {tramite.costo}
                      </span>
                      <span className="text-xs text-slate-600">
                        ⏱ {tramite.plazo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {completedCount >= requiredCount && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
            <span className="text-2xl">🎉</span>
            <p className="text-green-700 font-bold mt-1">
              ¡Trámites principales completados!
            </p>
            <p className="text-green-600 text-sm mt-1">
              Tu proyecto está en camino de ser legalizado.
            </p>
          </div>
        )}

        <p className="text-xs text-slate-400 border-t pt-3">
          * Información referencial. Costos y plazos sujetos a cambio según
          municipalidad y año fiscal. Fundación Génesis no se hace responsable
          de variaciones en los montos municipales.
        </p>
      </div>
    </section>
  );
}
