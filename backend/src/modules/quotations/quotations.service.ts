import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation, QuotationStatus } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';

const IVA_RATE = 0.12;

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationsRepo: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private readonly itemsRepo: Repository<QuotationItem>,
  ) {}

  async create(dto: CreateQuotationDto): Promise<Quotation> {
    const count = await this.quotationsRepo.count({
      where: { projectId: dto.projectId },
    });

    const items = dto.items.map((item) => {
      const subtotalGtq = Number((item.quantity * item.unitPriceGtq).toFixed(2));
      return this.itemsRepo.create({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPriceGtq: item.unitPriceGtq,
        subtotalGtq,
        note: item.note,
      });
    });

    const subtotalGtq = Number(items.reduce((sum, item) => sum + Number(item.subtotalGtq), 0).toFixed(2));
    const ivaGtq = Number((subtotalGtq * IVA_RATE).toFixed(2));
    const totalGtq = Number((subtotalGtq + ivaGtq).toFixed(2));

    const quotation = this.quotationsRepo.create({
      projectId: dto.projectId,
      versionNumber: count + 1,
      subtotalGtq,
      ivaGtq,
      totalGtq,
      status: QuotationStatus.DRAFT,
      items,
    });

    return this.quotationsRepo.save(quotation);
  }

  async findByProject(projectId: string): Promise<Quotation[]> {
    return this.quotationsRepo.find({
      where: { projectId },
      relations: ['items', 'items.material'],
      order: { versionNumber: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Quotation> {
    const quotation = await this.quotationsRepo.findOne({
      where: { id },
      relations: ['items', 'items.material'],
    });
    if (!quotation) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return quotation;
  }
}
