import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { CreateIpMcImportDto } from './dto/create-ipmc-import.dto';
import { IpMcItem } from './entities/ipmc-item.entity';
import { IpMcReport } from './entities/ipmc-report.entity';

interface ParsedIpMcItem {
  code: number;
  category: string | null;
  material: string;
  unit: string;
  indexPrev: number;
  indexCurrent: number;
  variation: number;
}

@Injectable()
export class IpMcService {
  constructor(
    @InjectRepository(IpMcReport)
    private readonly reportsRepo: Repository<IpMcReport>,
    @InjectRepository(IpMcItem)
    private readonly itemsRepo: Repository<IpMcItem>,
    private readonly dataSource: DataSource,
  ) {}

  private readonly execFileAsync = promisify(execFile);

  async importFromPdf(
    fileBuffer: Buffer,
    meta: CreateIpMcImportDto & { pdfUrl?: string; originalFilename?: string },
  ) {
    const text = await this.parsePdfToText(fileBuffer);
    const { items, skipped } = this.parseIpMcItems(text);

    if (items.length === 0) {
      throw new BadRequestException('No se pudieron extraer filas IPMC del PDF');
    }

    const reportId = await this.dataSource.transaction(async (manager) => {
      const reportRepo = manager.getRepository(IpMcReport);
      const itemRepo = manager.getRepository(IpMcItem);

      const existing = await reportRepo.findOneBy({
        year: meta.year,
        month: meta.month,
      });

      const report = reportRepo.create({
        id: existing?.id,
        year: meta.year,
        month: meta.month,
        source: meta.source || 'INE',
        pdfUrl: meta.pdfUrl || null,
        originalFilename: meta.originalFilename || null,
      });

      const savedReport = await reportRepo.save(report);

      await itemRepo.delete({ reportId: savedReport.id });
      await itemRepo.insert(
        items.map((item) => ({
          ...item,
          reportId: savedReport.id,
        })),
      );

      return savedReport.id;
    });

    return {
      reportId,
      year: meta.year,
      month: meta.month,
      itemsInserted: items.length,
      itemsSkipped: skipped,
    };
  }

  async importFromUrl(dto: { year: number; month: number; pdfUrl: string }) {
    const response = await fetch(dto.pdfUrl);
    if (!response.ok) {
      throw new BadRequestException(`No se pudo descargar PDF: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf') && !dto.pdfUrl.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('La URL no parece ser un PDF válido');
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    return this.importFromPdf(fileBuffer, {
      year: dto.year,
      month: dto.month,
      source: 'INE',
      pdfUrl: dto.pdfUrl,
    });
  }

  async getReports() {
    return this.reportsRepo.find({
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async getReportItems(reportId: string) {
    const report = await this.reportsRepo.findOneBy({ id: reportId });
    if (!report) throw new NotFoundException(`Reporte ${reportId} no encontrado`);

    return this.itemsRepo.find({
      where: { reportId },
      order: { code: 'ASC' },
    });
  }

  async getLatestReport() {
    const latest = await this.reportsRepo.findOne({
      order: { year: 'DESC', month: 'DESC' },
    });

    if (!latest) throw new NotFoundException('No hay reportes IPMC importados');
    return latest;
  }

  private async parsePdfToText(fileBuffer: Buffer): Promise<string> {
    const tempPdfPath = join(tmpdir(), `${randomUUID()}.pdf`);

    try {
      await fs.writeFile(tempPdfPath, fileBuffer);
      const { stdout } = await this.execFileAsync('pdftotext', ['-layout', '-enc', 'UTF-8', tempPdfPath, '-']);
      return stdout || '';
    } catch (error) {
      throw new InternalServerErrorException(
        `Error leyendo PDF (asegúrate que pdftotext esté instalado): ${(error as Error).message}`,
      );
    } finally {
      await fs.rm(tempPdfPath, { force: true });
    }
  }

  parseIpMcItems(text: string): { items: ParsedIpMcItem[]; skipped: number } {
    const lines = text
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const items: ParsedIpMcItem[] = [];
    let skipped = 0;
    let currentCategory: string | null = null;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (/^[A-Z]\.\s+/.test(line)) {
        currentCategory = line;
        continue;
      }

      if (!/^\d{1,4}\s+/.test(line)) continue;

      let candidate = line;
      let cursor = i + 1;

      while (cursor < lines.length) {
        const nextLine = lines[cursor];
        if (/^[A-Z]\.\s+/.test(nextLine) || /^\d{1,4}\s+/.test(nextLine)) break;
        candidate = `${candidate} ${nextLine}`;
        cursor += 1;
      }

      i = cursor - 1;
      const row = this.tryParseRow(candidate, currentCategory);
      if (row) {
        items.push(row);
      } else {
        skipped += 1;
      }
    }

    return { items, skipped };
  }

  private tryParseRow(line: string, category: string | null): ParsedIpMcItem | null {
    const baseMatch = line.match(/^(\d{1,4})\s+(.+)$/);
    if (!baseMatch) return null;

    const code = Number(baseMatch[1]);
    const remaining = baseMatch[2];

    const numsMatch = remaining.match(/(-?[\d.,]+)\s+(-?[\d.,]+)\s+(-?[\d.,]+)$/);
    if (!numsMatch) return null;

    const descriptor = remaining.slice(0, numsMatch.index).trim();
    const descriptorTokens = descriptor.split(/\s+/);
    if (descriptorTokens.length < 2) return null;

    const unit = descriptorTokens.pop() as string;
    const material = descriptorTokens.join(' ').trim();

    const indexPrev = this.parseLocaleNumber(numsMatch[1]);
    const indexCurrent = this.parseLocaleNumber(numsMatch[2]);
    const variation = this.parseLocaleNumber(numsMatch[3]);

    if ([indexPrev, indexCurrent, variation].some((value) => Number.isNaN(value))) return null;

    return {
      code,
      category,
      material,
      unit,
      indexPrev,
      indexCurrent,
      variation,
    };
  }

  private parseLocaleNumber(value: string): number {
    const trimmed = value.trim();

    if (trimmed.includes(',') && trimmed.includes('.')) {
      return Number.parseFloat(trimmed.replace(/\./g, '').replace(',', '.'));
    }

    if (trimmed.includes(',')) {
      return Number.parseFloat(trimmed.replace(',', '.'));
    }

    return Number.parseFloat(trimmed);
  }
}
