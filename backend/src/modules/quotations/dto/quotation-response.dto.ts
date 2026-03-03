import { Quotation } from '../entities/quotation.entity';

export type QuotationResponseDto = Quotation & {
  ivaIncluido: true;
};
