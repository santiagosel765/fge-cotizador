'use client';

import { Fragment, useMemo, useState } from 'react';
import { IpMcItem } from '@/services/ipmc.service';

interface IpMcItemsTableProps {
  items: IpMcItem[];
  isLoading?: boolean;
}

function formatNumber(value: number | string): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(numeric);
}

export function IpMcItemsTable({ items, isLoading = false }: Readonly<IpMcItemsTableProps>): JSX.Element {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const codeMatch = String(item.code).includes(query);
      const materialMatch = item.material.toLowerCase().includes(query);
      return codeMatch || materialMatch;
    });
  }, [items, search]);

  return (
    <section id="ipmc-items-section" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Items del reporte ({filteredItems.length})</h2>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm md:max-w-sm"
          type="search"
          placeholder="Buscar por código o material..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? <p className="mt-4 text-sm text-slate-600">Cargando items...</p> : null}

      {!isLoading && filteredItems.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No hay items para mostrar con el filtro actual.</p>
      ) : null}

      {!isLoading && filteredItems.length > 0 ? (
        <div className="mt-4 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="w-16 px-2 py-2">Código</th>
                <th className="px-2 py-2">Material</th>
                <th className="w-24 px-2 py-2">Unidad</th>
                <th className="w-28 px-2 py-2 text-right">Índice Dic 2025</th>
                <th className="w-28 px-2 py-2 text-right">Índice Ene 2026</th>
                <th className="w-24 px-2 py-2 text-right">Var. %</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => {
                const prevItem = index > 0 ? filteredItems[index - 1] : null;
                const showCategory = item.category && item.category !== prevItem?.category;

                return (
                  <Fragment key={item.id}>
                    {showCategory ? (
                      <tr>
                        <td colSpan={6} className="border-b border-amber-200 bg-amber-50 px-2 py-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-amber-800">{item.category}</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-2 font-medium text-slate-800">{item.code}</td>
                      <td className="px-2 py-2 text-slate-700">{item.material}</td>
                      <td className="px-2 py-2 text-xs text-slate-500">{item.unit}</td>
                      <td className="px-2 py-2 text-right text-slate-700">{formatNumber(item.indexPrev)}</td>
                      <td className="px-2 py-2 text-right text-slate-700">{formatNumber(item.indexCurrent)}</td>
                      <td
                        className={`px-2 py-2 text-right text-xs font-medium ${
                          Number(item.variation) > 0
                            ? 'text-red-600'
                            : Number(item.variation) < 0
                              ? 'text-green-600'
                              : 'text-slate-400'
                        }`}
                      >
                        {Number(item.variation) > 0 ? '+' : ''}
                        {formatNumber(item.variation)}%
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
