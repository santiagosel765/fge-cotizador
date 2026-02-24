import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Material } from '../../materials/entities/material.entity';
import { Quotation } from './quotation.entity';

@Entity('quotation_items')
export class QuotationItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  quotationId!: string;

  @Column()
  materialId!: string;

  @Column('decimal', { precision: 10, scale: 3 })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPriceGtq!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotalGtq!: number;

  @Column('text', { nullable: true })
  note!: string;

  @ManyToOne(() => Quotation, (quotation) => quotation.items)
  @JoinColumn({ name: 'quotationId' })
  quotation!: Quotation;

  @ManyToOne(() => Material, (material) => material.quotationItems)
  @JoinColumn({ name: 'materialId' })
  material!: Material;
}
