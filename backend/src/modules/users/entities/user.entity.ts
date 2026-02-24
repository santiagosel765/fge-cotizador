import { AiConversation } from '../../ai/entities/ai-conversation.entity';
import { CreditRequest } from '../../credit-requests/entities/credit-request.entity';
import { Project } from '../../projects/entities/project.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CLIENT = 'client',
  ADVISOR = 'advisor',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  passwordHash!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;

  @OneToMany(() => Project, (project) => project.user)
  projects!: Project[];

  @OneToMany(() => CreditRequest, (creditRequest) => creditRequest.user)
  creditRequests!: CreditRequest[];

  @OneToMany(() => AiConversation, (aiConversation) => aiConversation.user)
  aiConversations!: AiConversation[];
}
