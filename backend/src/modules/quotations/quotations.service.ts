import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation, QuotationStatus } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { QuotationResponseDto } from './dto/quotation-response.dto';

const IVA_RATE = 0.12;
const IVA_DIVISOR = 1 + IVA_RATE;

function round2(value: number): number {
  return Number(value.toFixed(2));
}

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationsRepo: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private readonly itemsRepo: Repository<QuotationItem>,
  ) {}

  private withIvaIncluido(quotation: Quotation): QuotationResponseDto {
    return {
      ...quotation,
      ivaIncluido: true,
    };
  }

  async create(dto: CreateQuotationDto): Promise<QuotationResponseDto> {
    const count = await this.quotationsRepo.count({
      where: { projectId: dto.projectId },
    });

    const items = dto.items.map((item) => {
      const unitPriceWithIva = round2(item.unitPriceGtq * IVA_DIVISOR);
      const subtotalGtq = round2(item.quantity * unitPriceWithIva);
      return this.itemsRepo.create({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPriceGtq: unitPriceWithIva,
        subtotalGtq,
        note: item.note,
      });
    });

    const subtotalGtq = round2(items.reduce((sum, item) => sum + Number(item.subtotalGtq), 0));
    const ivaGtq = round2((subtotalGtq * IVA_RATE) / IVA_DIVISOR);
    const totalGtq = subtotalGtq;

    const quotation = this.quotationsRepo.create({
      projectId: dto.projectId,
      versionNumber: count + 1,
      subtotalGtq,
      ivaGtq,
      totalGtq,
      status: QuotationStatus.DRAFT,
      items,
    });

    const savedQuotation = await this.quotationsRepo.save(quotation);
    return this.withIvaIncluido(savedQuotation);
  }

  async findByProject(projectId: string): Promise<QuotationResponseDto[]> {
    const quotations = await this.quotationsRepo.find({
      where: { projectId },
      relations: ['items', 'items.material'],
      order: { versionNumber: 'DESC' },
    });

    return quotations.map((quotation) => this.withIvaIncluido(quotation));
  }

  async findOne(id: string): Promise<QuotationResponseDto> {
    const quotation = await this.quotationsRepo.findOne({
      where: { id },
      relations: ['items', 'items.material'],
    });
    if (!quotation) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return this.withIvaIncluido(quotation);
  }
}
