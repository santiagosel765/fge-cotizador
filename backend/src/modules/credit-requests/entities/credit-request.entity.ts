import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum CreditRequestStatus {
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('credit_requests')
export class CreditRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  projectId!: string;

  @Column({ nullable: true })
  userId!: string;

  @Column({ unique: true })
  ticketNumber!: string;

  @Column()
  applicantName!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ type: 'enum', enum: CreditRequestStatus, default: CreditRequestStatus.SUBMITTED })
  status!: CreditRequestStatus;

  @Column('text', { nullable: true })
  notes!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @ManyToOne(() => User, (user) => user.creditRequests, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
