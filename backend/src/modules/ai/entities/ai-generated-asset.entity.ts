import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum AiAssetType {
  BLUEPRINT = 'blueprint',
  RENDER = 'render',
  PANORAMA = 'panorama',
}

export enum AiAssetStatus {
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('ai_generated_assets')
export class AiGeneratedAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  projectId!: string;

  @Column({ type: 'enum', enum: AiAssetType })
  assetType!: AiAssetType;

  @Column('text')
  storageUrl!: string;

  @Column('text')
  prompt!: string;

  @Column()
  modelUsed!: string;

  @Column({ type: 'enum', enum: AiAssetStatus })
  status!: AiAssetStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Project, (project) => project.aiAssets)
  @JoinColumn({ name: 'projectId' })
  project!: Project;
}
