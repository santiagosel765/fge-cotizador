export type ProjectStatus =
  | 'draft' | 'planned' | 'quoted' | 'credit_requested' | 'completed';

export interface Project {
  id: string;
  name: string;
  userDescription: string;
  detailedConcept?: string;
  planoAcotadoSvg?: string;
  planoElectricoSvg?: string;
  planoFuerzaSvg?: string;
  planoHidraulicoSvg?: string;
  planoDrenajesSvg?: string;
  planoCimentacionesSvg?: string;
  blueprintPrompt?: string;
  renderPrompt?: string;
  panoPrompt?: string;
  status: ProjectStatus;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  quotations?: Quotation[];
  aiAssets?: AiAsset[];
}

export interface Quotation {
  id: string;
  projectId: string;
  versionNumber: number;
  subtotalGtq: number;
  ivaGtq: number;
  totalGtq: number;
  laborGtq?: number | null;
  laborPct?: number | null;
  laborProjectType?: string | null;
  ivaIncluido: boolean;
  status: 'draft' | 'finalized';
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  materialId: string;
  quantity: number;
  unitPriceGtq: number;
  subtotalGtq: number;
  note?: string;
  material?: Material;
}

export interface Material {
  id: string;
  legacyCode: string;
  name: string;
  unit: string;
  unitPriceGtq: number | string;
  category?: MaterialCategory;
}

export interface MaterialCategory {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  materials?: Material[];
}

export interface AiAsset {
  id: string;
  assetType: 'blueprint' | 'render' | 'panorama';
  storageUrl?: string;
  status: 'generating' | 'ready' | 'failed';
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
