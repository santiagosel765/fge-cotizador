import { IVA_RATE } from './constants';

export const formatGTQ = (amount: number): string =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

export const calculateTotals = (
  items: Array<{ quantity: number; unitPriceGtq: number }>,
): { subtotal: number; iva: number; total: number } => {
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPriceGtq, 0);
  const iva = subtotal * IVA_RATE;
  return { subtotal, iva, total: subtotal + iva };
};
