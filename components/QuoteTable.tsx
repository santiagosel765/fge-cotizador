
import React from 'react';
import { QuoteItem } from '../types';
import TrashIcon from './icons/TrashIcon';

interface QuoteTableProps {
  items: QuoteItem[];
  onRemoveItem: (materialId: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(amount);
};

const QuoteTable: React.FC<QuoteTableProps> = ({ items, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center text-slate-500">
        <p className="text-lg">Tu cotización está vacía.</p>
        <p>Agrega materiales desde el formulario para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <h2 className="text-2xl font-bold text-slate-800 p-6">Cotización</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3">Material</th>
              <th scope="col" className="px-6 py-3 text-right">Precio Unit.</th>
              <th scope="col" className="px-6 py-3 text-center">Cantidad</th>
              <th scope="col" className="px-6 py-3 text-right">Subtotal</th>
              <th scope="col" className="px-6 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ material, quantity }) => (
              <tr key={material.id} className="bg-white border-b hover:bg-slate-50 animate__animated animate__fadeIn">
                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                  {material.name} <br/>
                  <span className="text-xs text-slate-500">{material.unit}</span>
                </td>
                <td className="px-6 py-4 text-right">{formatCurrency(material.price)}</td>
                <td className="px-6 py-4 text-center">{quantity}</td>
                <td className="px-6 py-4 text-right font-semibold">{formatCurrency(material.price * quantity)}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onRemoveItem(material.id)}
                    className="text-red-500 hover:text-red-700 transition"
                    aria-label={`Eliminar ${material.name}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuoteTable;
