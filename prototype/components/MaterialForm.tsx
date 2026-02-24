
import React, { useState } from 'react';
import { Material } from '../types';
import { MATERIALS_DB } from '../constants';
import PlusIcon from './icons/PlusIcon';

interface MaterialFormProps {
  onAddItem: (materialId: string, quantity: number) => void;
  addedMaterialIds: Set<string>;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ onAddItem, addedMaterialIds }) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string>('');

  const availableMaterials = MATERIALS_DB.filter(m => !addedMaterialIds.has(m.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId) {
      setError('Por favor, selecciona un material.');
      return;
    }
    if (quantity <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    onAddItem(selectedMaterialId, quantity);
    setSelectedMaterialId('');
    setQuantity(1);
    setError('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Agregar Material</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="material-select" className="block text-sm font-medium text-slate-600 mb-1">
            Material
          </label>
          <select
            id="material-select"
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">-- Selecciona un material --</option>
            {availableMaterials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} ({material.unit})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quantity-input" className="block text-sm font-medium text-slate-600 mb-1">
            Cantidad
          </label>
          <input
            id="quantity-input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min="1"
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5" />
          Agregar a la Cotización
        </button>
      </form>
    </div>
  );
};

export default MaterialForm;
