import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('labor_configs')
export class LaborConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  projectType!: string;

  @Column()
  label!: string;

  @Column('decimal', { precision: 5, scale: 4 })
  percentage!: number;

  @Column({ default: true })
  isActive!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
