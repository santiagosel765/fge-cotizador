import React from 'react';
import { IVA_RATE } from '../constants';

interface SummaryProps {
  subtotal: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(amount);
};

const Summary: React.FC<SummaryProps> = ({ subtotal }) => {
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Resumen de Costos</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>IVA ({IVA_RATE * 100}%):</span>
          <span className="font-medium">{formatCurrency(iva)}</span>
        </div>
        <hr className="my-2 border-t border-slate-200" />
        <div className="flex justify-between text-slate-900 text-xl font-bold">
          <span>Total Estimado:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default Summary;