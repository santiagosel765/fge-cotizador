export interface MaterialCategory {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface Material {
  id: string;
  legacyCode: string;
  categoryId: string;
  category?: MaterialCategory;
  name: string;
  unit: string;
  unitPriceGtq: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  materialId: string;
  material?: Material;
  quantity: number;
  unitPriceGtq: number;
  subtotalGtq: number;
  note?: string | null;
}
