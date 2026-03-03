'use client';

import { useEffect, useState } from 'react';
import type { Project, Material, MaterialCategory } from '@/types/project';
import { api } from '@/lib/api';

interface Props {
  project: Project;
}

interface CartItem {
  material: Material;
  quantity: number;
}

const IVA_RATE = 0.12;

export default function QuotationTab({ project }: Props) {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<MaterialCategory[]>('/materials/categories')
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  const allMaterials = categories.flatMap(c => c.materials ?? []);
  const filtered = selectedCategory === 'all'
    ? allMaterials
    : (categories.find(c => c.id === selectedCategory)?.materials ?? []);

  function addToCart(material: Material) {
    setCart(prev => {
      const existing = prev.find(i => i.material.id === material.id);
      if (existing) {
        return prev.map(i =>
          i.material.id === material.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { material, quantity: 1 }];
    });
  }

  function updateQty(materialId: string, qty: number) {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.material.id !== materialId));
    } else {
      setCart(prev => prev.map(i =>
        i.material.id === materialId ? { ...i, quantity: qty } : i
      ));
    }
  }

  const subtotal = cart.reduce((sum, i) => sum + Number(i.material.unitPriceGtq) * i.quantity, 0);
  const iva = (subtotal * IVA_RATE) / (1 + IVA_RATE);
  const total = subtotal;

  async function saveQuotation() {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      await api.post('/quotations', {
        projectId: project.id,
        items: cart.map(i => ({
          materialId: i.material.id,
          quantity: i.quantity,
          unitPriceGtq: i.material.unitPriceGtq,
        })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando materiales...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Catálogo de Materiales</h3>
            <p className="text-xs text-gray-400">Precios en Quetzales (GTQ) con IVA incluido</p>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filtered.map(material => (
              <div key={material.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{material.name}</p>
                  <p className="text-xs text-gray-500">{material.unit} · {material.legacyCode}</p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="text-sm font-semibold text-gray-900 text-right">
                    Q{Number(material.unitPriceGtq).toFixed(2)}
                    <span className="block text-[11px] font-normal text-gray-400">IVA incluido</span>
                  </span>
                  <button
                    onClick={() => addToCart(material)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Cotización</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-72 divide-y">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">
                Agrega materiales para cotizar
              </p>
            ) : (
              cart.map(item => (
                <div key={item.material.id} className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-800 truncate">{item.material.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={e => updateQty(item.material.id, Number(e.target.value))}
                      className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs"
                    />
                    <span className="text-xs text-gray-500">{item.material.unit}</span>
                    <span className="ml-auto text-right text-xs font-semibold">
                      Q{(Number(item.material.unitPriceGtq) * item.quantity).toFixed(2)}
                      <span className="block text-[11px] font-normal text-gray-400">IVA incluido</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal (con IVA incluido)</span>
              <span>Q{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IVA 12% (incluido)</span>
              <span>Q{iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t">
              <span>TOTAL</span>
              <span>Q{total.toFixed(2)}</span>
            </div>
            <button
              onClick={saveQuotation}
              disabled={cart.length === 0 || saving}
              className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cotización'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
