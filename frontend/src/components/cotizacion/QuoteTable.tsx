'use client';

interface QuoteRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPriceGtq: number;
}

interface QuoteTableProps {
  items: QuoteRow[];
}

export function QuoteTable({ items }: QuoteTableProps): JSX.Element {
  return (
    <table className="w-full text-sm text-left text-slate-600">
      <thead className="bg-slate-100 text-xs uppercase text-slate-700">
        <tr>
          <th className="px-4 py-2">Material</th>
          <th className="px-4 py-2 text-right">Precio Unit.</th>
          <th className="px-4 py-2 text-center">Cantidad</th>
          <th className="px-4 py-2 text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="px-4 py-2">{item.name}<div className="text-xs text-slate-500">{item.unit}</div></td>
            <td className="px-4 py-2 text-right">Q{item.unitPriceGtq.toFixed(2)}<div className="text-[11px] text-slate-400">IVA incluido</div></td>
            <td className="px-4 py-2 text-center">{item.quantity}</td>
            <td className="px-4 py-2 text-right font-semibold">Q{(item.unitPriceGtq * item.quantity).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
