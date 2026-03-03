'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface TechnicalPlan {
  type: 'acotado' | 'electrico' | 'fuerza' | 'hidraulico' | 'drenajes' | 'cimentaciones';
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

const TECHNICAL_PLANS: TechnicalPlan[] = [
  {
    type: 'acotado',
    label: 'Plano Acotado',
    icon: '📏',
    color: '#1A56DB',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Plano arquitectónico con todas las cotas y medidas',
  },
  {
    type: 'electrico',
    label: 'Instalaciones Eléctricas',
    icon: '⚡',
    color: '#D97706',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Circuitos de iluminación y tomacorrientes',
  },
  {
    type: 'fuerza',
    label: 'Plano de Fuerza',
    icon: '🔌',
    color: '#DC2626',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Circuitos 220V: cocina, lavadora, A/C',
  },
  {
    type: 'hidraulico',
    label: 'Instalaciones Hidráulicas',
    icon: '💧',
    color: '#0891B2',
    bgColor: 'bg-cyan-50 border-cyan-200',
    description: 'Red de agua potable desde medidor',
  },
  {
    type: 'drenajes',
    label: 'Plano de Drenajes',
    icon: '🚰',
    color: '#059669',
    bgColor: 'bg-emerald-50 border-emerald-200',
    description: 'Drenaje sanitario y pluvial',
  },
  {
    type: 'cimentaciones',
    label: 'Plano de Cimentaciones',
    icon: '🏗️',
    color: '#92400E',
    bgColor: 'bg-amber-50 border-yellow-200',
    description: 'Zapatas y vigas de cimentación según AGIES Guatemala',
  },
];

interface TechnicalPlansSectionProps {
  projectId: string;
  blueprintGenerated: boolean;
  initialPlans: Partial<Record<TechnicalPlan['type'], string>>;
}

export function TechnicalPlansSection({
  projectId,
  blueprintGenerated,
  initialPlans,
}: TechnicalPlansSectionProps) {
  const [plans, setPlans] = useState<Partial<Record<TechnicalPlan['type'], string>>>(initialPlans);
  const [loading, setLoading] = useState<Partial<Record<TechnicalPlan['type'], boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<TechnicalPlan['type'], string>>>({});

  async function handleGenerate(type: TechnicalPlan['type']) {
    setLoading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: '' }));
    try {
      const result = await api.post<{ svgContent: string }>(
        `/ai/technical-plan/${projectId}/${type}`,
        {},
      );
      setPlans(prev => ({ ...prev, [type]: result.svgContent }));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [type]: err instanceof Error ? err.message : 'Error generando plano',
      }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }

  if (!blueprintGenerated) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
        <span className="text-4xl mb-3 block">📐</span>
        <p className="text-slate-500 font-medium">
          Genera el Plano Arquitectónico primero
        </p>
        <p className="text-slate-400 text-sm mt-1">
          Los planos técnicos se habilitan después del plan base
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {TECHNICAL_PLANS.map(plan => {
        const svg = plans[plan.type];
        const isLoading = loading[plan.type];
        const error = errors[plan.type];

        return (
          <div
            key={plan.type}
            className={`border-2 rounded-xl overflow-hidden ${plan.bgColor}`}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: plan.color }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{plan.icon}</span>
                <div>
                  <h3 className="text-white font-bold text-sm">{plan.label}</h3>
                  <p className="text-white/70 text-xs">{plan.description}</p>
                </div>
              </div>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                {isLoading ? 'Generando...' : svg ? 'Generado ✓' : 'No generado'}
              </span>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div
                    className="animate-spin w-8 h-8 border-4 border-current border-t-transparent rounded-full"
                    style={{ color: plan.color }}
                  />
                  <p className="text-sm text-slate-500">Generando plano...</p>
                  <p className="text-xs text-slate-400">30-60 segundos</p>
                </div>
              ) : svg ? (
                <div className="space-y-3">
                  <div
                    className="w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2"
                    style={{ minHeight: '200px' }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: svg }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerate(plan.type)}
                    className="w-full text-xs py-1.5 px-3 rounded-lg border border-current hover:bg-white/50 transition-colors font-medium"
                    style={{ color: plan.color }}
                  >
                    ↺ Regenerar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  {error ? (
                    <p className="text-xs text-red-500 text-center px-2">{error}</p>
                  ) : (
                    <>
                      <span className="text-4xl opacity-40">{plan.icon}</span>
                      <p className="text-xs text-slate-400 text-center">{plan.description}</p>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGenerate(plan.type)}
                    className="mt-2 px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: plan.color }}
                  >
                    ✨ Generar {plan.label}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
