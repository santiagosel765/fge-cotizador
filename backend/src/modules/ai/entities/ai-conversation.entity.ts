import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { AiMessage } from './ai-message.entity';

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  projectId!: string;

  @Column({ nullable: true })
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Project, (project) => project.aiConversations)
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @ManyToOne(() => User, (user) => user.aiConversations, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => AiMessage, (message) => message.conversation)
  aiMessages!: AiMessage[];
}
