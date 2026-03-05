import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LaborConfig } from './entities/labor-config.entity';

interface UpdateLaborConfigInput {
  label?: string;
  percentage?: number;
}

@Injectable()
export class LaborConfigService {
  constructor(
    @InjectRepository(LaborConfig)
    private readonly laborConfigRepo: Repository<LaborConfig>,
  ) {}

  async findAll(): Promise<LaborConfig[]> {
    return this.laborConfigRepo.find({
      order: { projectType: 'ASC' },
    });
  }

  async update(id: string, input: UpdateLaborConfigInput): Promise<LaborConfig> {
    const config = await this.laborConfigRepo.findOneBy({ id });
    if (!config) {
      throw new NotFoundException(`Configuración de mano de obra ${id} no encontrada`);
    }

    if (input.label !== undefined) {
      config.label = input.label;
    }

    if (input.percentage !== undefined) {
      config.percentage = input.percentage;
    }

    return this.laborConfigRepo.save(config);
  }
}
