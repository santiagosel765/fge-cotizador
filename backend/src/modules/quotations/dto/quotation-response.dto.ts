import { Quotation } from '../entities/quotation.entity';

export interface QuotationLaborResponse {
  subtotalGtq: number;
  ivaGtq: number;
  percentage: number;
  projectType: string;
}

export interface QuotationGrandTotalResponse {
  subtotalGtq: number;
  ivaGtq: number;
  totalGtq: number;
}

export type QuotationResponseDto = Quotation & {
  ivaIncluido: true;
  labor: QuotationLaborResponse | null;
  grandTotal: QuotationGrandTotalResponse;
};
