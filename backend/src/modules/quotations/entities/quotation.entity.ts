import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { QuotationItem } from './quotation-item.entity';

export enum QuotationStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
}

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  projectId!: string;

  @Column({ default: 1 })
  versionNumber!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotalGtq!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  ivaGtq!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalGtq!: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  laborGtq!: number | null;

  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  laborPct!: number | null;

  @Column('varchar', { length: 50, nullable: true })
  laborProjectType!: string | null;

  @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT })
  status!: QuotationStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Project, (project) => project.quotations)
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @OneToMany(() => QuotationItem, (item) => item.quotation)
  items!: QuotationItem[];
}
