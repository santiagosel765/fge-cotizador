import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { IpMcItem } from './ipmc-item.entity';

@Entity('ipmc_reports')
@Unique(['year', 'month'])
export class IpMcReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'text', nullable: true })
  pdfUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  originalFilename!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index('IDX_ipmc_reports_imported_at')
  importedAt!: Date;

  @Column({ type: 'text', default: 'INE' })
  source!: string;

  @OneToMany(() => IpMcItem, (item) => item.report, { cascade: true })
  items!: IpMcItem[];
}
