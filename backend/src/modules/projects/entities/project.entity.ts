import { AiConversation } from '../../ai/entities/ai-conversation.entity';
import { AiGeneratedAsset } from '../../ai/entities/ai-generated-asset.entity';
import { Quotation } from '../../quotations/entities/quotation.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  QUOTED = 'quoted',
  CREDIT_REQUESTED = 'credit_requested',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  name!: string;

  @Column('text')
  userDescription!: string;

  @Column('text', { nullable: true })
  detailedConcept!: string;

  @Column('text', { nullable: true })
  blueprintPrompt!: string;

  @Column('text', { nullable: true })
  renderPrompt!: string;

  @Column('text', { nullable: true })
  panoPrompt!: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status!: ProjectStatus;

  @Column({ nullable: true })
  addressText!: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude!: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Quotation, (quotation) => quotation.project)
  quotations!: Quotation[];

  @OneToMany(() => AiGeneratedAsset, (asset) => asset.project)
  aiAssets!: AiGeneratedAsset[];

  @OneToMany(() => AiConversation, (conversation) => conversation.project)
  aiConversations!: AiConversation[];
}
