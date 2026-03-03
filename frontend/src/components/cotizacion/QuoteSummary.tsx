interface QuoteSummaryProps {
  subtotal: number;
  iva: number;
  total: number;
}

export function QuoteSummary({ subtotal, iva, total }: QuoteSummaryProps): JSX.Element {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-slate-600">
        <span>Subtotal (con IVA incluido)</span>
        <span className="font-medium">Q{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span>IVA 12% (incluido)</span>
        <span className="font-medium">Q{iva.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between text-base font-bold text-slate-900">
        <span>TOTAL</span>
        <span>Q{total.toFixed(2)}</span>
      </div>
    </div>
  );
}
