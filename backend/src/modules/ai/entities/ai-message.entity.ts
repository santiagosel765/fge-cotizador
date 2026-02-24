import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AiConversation } from './ai-conversation.entity';

export enum AiMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('ai_messages')
export class AiMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  conversationId!: string;

  @Column({ type: 'enum', enum: AiMessageRole })
  role!: AiMessageRole;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  tokenCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => AiConversation, (conversation) => conversation.aiMessages)
  @JoinColumn({ name: 'conversationId' })
  conversation!: AiConversation;
}
