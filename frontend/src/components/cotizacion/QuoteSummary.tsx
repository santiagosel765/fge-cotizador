interface QuoteSummaryProps {
  subtotal: number;
  iva: number;
  laborSubtotal: number;
  laborIva: number;
  laborPercentage: number;
  laborProjectType: string;
  grandIva: number;
  total: number;
}

const laborTypeLabels: Record<string, string> = {
  economica: 'Vivienda económica',
  media: 'Vivienda media',
  ampliacion: 'Ampliación',
  obra_gris: 'Obra gris',
  sin_mano_obra: 'Sin mano de obra',
};

export function QuoteSummary({
  subtotal,
  iva,
  laborSubtotal,
  laborIva,
  laborPercentage,
  laborProjectType,
  grandIva,
  total,
}: QuoteSummaryProps): JSX.Element {
  const projectTypeLabel = laborTypeLabels[laborProjectType] ?? 'Tipo no definido';

  return (
    <div className="space-y-3 text-sm">
      <div className="font-bold tracking-wide text-slate-800">MATERIALES</div>
      <div className="flex justify-between text-slate-600">
        <span>Subtotal materiales (IVA incl.)</span>
        <span className="font-medium">Q{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span>IVA 12% (incluido)</span>
        <span className="font-medium">Q{iva.toFixed(2)}</span>
      </div>

      <div className="pt-2 font-bold tracking-wide text-slate-800">
        MANO DE OBRA (Estimado {laborPercentage.toFixed(2)}%)
      </div>
      <div className="text-xs text-slate-500">{projectTypeLabel}</div>
      <div className="flex justify-between text-slate-600">
        <span>Subtotal mano de obra (IVA incl.)</span>
        <span className="font-medium">Q{laborSubtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span>IVA 12% (incluido)</span>
        <span className="font-medium">Q{laborIva.toFixed(2)}</span>
      </div>

      <div className="border-t pt-2 flex justify-between text-slate-600">
        <span>IVA total incluido</span>
        <span className="font-medium">Q{grandIva.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between text-base font-bold text-slate-900">
        <span>TOTAL GENERAL</span>
        <span>Q{total.toFixed(2)}</span>
      </div>
      <p className="text-xs text-slate-500">
        * Mano de obra es un estimado referencial. Sujeto a negociación con el contratista.
      </p>
    </div>
  );
}
