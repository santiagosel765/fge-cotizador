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
import { QuotationItem } from '../../quotations/entities/quotation-item.entity';
import { MaterialCategory } from './material-category.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  legacyCode!: string;

  @Column()
  categoryId!: string;

  @Column()
  name!: string;

  @Column()
  unit!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPriceGtq!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  validFrom!: string;

  @Column({ type: 'date', nullable: true })
  validUntil!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => MaterialCategory, (category) => category.materials)
  @JoinColumn({ name: 'categoryId' })
  category!: MaterialCategory;

  @OneToMany(() => QuotationItem, (quotationItem) => quotationItem.material)
  quotationItems!: QuotationItem[];
}
