import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Material } from './material.entity';

@Entity('material_categories')
export class MaterialCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ default: 0 })
  sortOrder!: number;

  @OneToMany(() => Material, (material) => material.category)
  materials!: Material[];
}
