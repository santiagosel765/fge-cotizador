import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation, QuotationStatus } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { QuotationResponseDto } from './dto/quotation-response.dto';

const IVA_RATE = 0.12;
const IVA_DIVISOR = 1 + IVA_RATE;

interface LaborConfig {
  projectType: string;
  customPercentage?: number;
}

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

  private getLaborPercentage(projectType?: string): number {
    const normalizedType = (projectType ?? '').toLowerCase();

    switch (normalizedType) {
      case 'economica':
        return 0.35;
      case 'media':
        return 0.4;
      case 'ampliacion':
        return 0.3;
      case 'obra_gris':
        return 0.25;
      default:
        return 0.35;
    }
  }

  private withIvaIncluido(quotation: Quotation): QuotationResponseDto {
    const laborSubtotal = quotation.laborGtq ? Number(quotation.laborGtq) : 0;
    const laborIvaGtq = laborSubtotal > 0 ? round2((laborSubtotal * IVA_RATE) / IVA_DIVISOR) : 0;
    const materialsSubtotal = Number(quotation.subtotalGtq);
    const materialsIvaGtq = round2((materialsSubtotal * IVA_RATE) / IVA_DIVISOR);

    return {
      ...quotation,
      ivaIncluido: true,
      labor: laborSubtotal > 0
        ? {
            subtotalGtq: laborSubtotal,
            ivaGtq: laborIvaGtq,
            percentage: round2((Number(quotation.laborPct ?? 0) || 0) * 100),
            projectType: quotation.laborProjectType ?? 'default',
          }
        : null,
      grandTotal: {
        subtotalGtq: round2(materialsSubtotal + laborSubtotal),
        ivaGtq: round2(materialsIvaGtq + laborIvaGtq),
        totalGtq: Number(quotation.totalGtq),
      },
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

    const laborConfig = dto.laborConfig as LaborConfig | undefined;
    const defaultLaborPct = this.getLaborPercentage(laborConfig?.projectType);
    const hasCustomPercentage = typeof laborConfig?.customPercentage === 'number';
    const customPercentage = hasCustomPercentage ? Math.max(0, laborConfig!.customPercentage!) / 100 : undefined;
    const laborPct = customPercentage ?? defaultLaborPct;
    const laborBaseGtq = round2(subtotalGtq * laborPct);
    const laborIvaGtq = round2((laborBaseGtq * IVA_RATE) / IVA_DIVISOR);
    const laborNetGtq = round2(laborBaseGtq - laborIvaGtq);
    const grandTotalGtq = round2(subtotalGtq + laborBaseGtq);
    const grandIvaGtq = round2(ivaGtq + laborIvaGtq);
    void laborNetGtq;
    void grandIvaGtq;

    const quotation = this.quotationsRepo.create({
      projectId: dto.projectId,
      versionNumber: count + 1,
      subtotalGtq,
      ivaGtq,
      totalGtq: grandTotalGtq,
      laborGtq: laborBaseGtq,
      laborPct,
      laborProjectType: laborConfig?.projectType ?? 'default',
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
