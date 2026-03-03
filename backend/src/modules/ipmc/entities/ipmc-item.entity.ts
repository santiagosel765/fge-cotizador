import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { IpMcReport } from './ipmc-report.entity';

@Entity('ipmc_items')
@Index('IDX_ipmc_items_report_id', ['reportId'])
@Unique(['reportId', 'code'])
export class IpMcItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  reportId!: string;

  @ManyToOne(() => IpMcReport, (report) => report.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report!: IpMcReport;

  @Column({ type: 'int' })
  code!: number;

  @Column({ type: 'text', nullable: true })
  category!: string | null;

  @Column({ type: 'text' })
  material!: string;

  @Column({ type: 'text' })
  unit!: string;

  @Column('decimal', { precision: 12, scale: 4 })
  indexPrev!: number;

  @Column('decimal', { precision: 12, scale: 4 })
  indexCurrent!: number;

  @Column('decimal', { precision: 12, scale: 4 })
  variation!: number;
}
