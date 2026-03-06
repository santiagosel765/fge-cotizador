import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepo.create({
      name: dto.name,
      userDescription: dto.userDescription,
      userId: dto.userId ?? '00000000-0000-0000-0000-000000000000',
      status: ProjectStatus.DRAFT,
    });
    return this.projectsRepo.save(project);
  }

  async findAll(userId?: string): Promise<Project[]> {
    const qb = this.projectsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.quotations', 'q')
      .leftJoinAndSelect('p.aiAssets', 'a')
      .where('p.deletedAt IS NULL')
      .orderBy('p.createdAt', 'DESC');

    if (userId) {
      qb.andWhere('p.userId = :userId', { userId });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: { id },
      relations: ['aiAssets', 'quotations', 'quotations.items', 'aiConversations'],
    });
    if (!project) throw new NotFoundException(`Proyecto ${id} no encontrado`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Project> {
    const project = await this.findOne(id);
    if (dto.addressText !== undefined) project.addressText = dto.addressText;
    if (dto.latitude !== undefined) project.latitude = dto.latitude;
    if (dto.longitude !== undefined) project.longitude = dto.longitude;
    return this.projectsRepo.save(project);
  }

  async updateStatus(id: string, dto: UpdateStatusDto): Promise<Project> {
    const project = await this.findOne(id);
    project.status = dto.status;
    return this.projectsRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectsRepo.softRemove(project);
  }

  // Usado por AiModule para actualizar plan conceptual
  async savePlan(
    id: string,
    planData: {
      detailedConcept: string;
      blueprintPrompt: string;
      renderPrompt: string;
      panoPrompt: string;
    },
  ): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, planData);
    project.status = ProjectStatus.PLANNED;
    return this.projectsRepo.save(project);
  }

  async saveTechnicalPlan(
    projectId: string,
    field: 'planoAcotadoSvg' | 'planoElectricoSvg' | 'planoFuerzaSvg'
    | 'planoHidraulicoSvg' | 'planoDrenajesSvg' | 'planoCimentacionesSvg',
    svgContent: string,
  ): Promise<void> {
    await this.projectsRepo.update(projectId, { [field]: svgContent });
  }
}
