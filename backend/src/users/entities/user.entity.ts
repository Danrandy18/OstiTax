import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionProvider, UserPlan } from '../enums/user-plan.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  deviceId!: string;

  @Column({ type: 'varchar', length: 16, default: UserPlan.FREE })
  plan!: UserPlan;

  @Column({ type: 'int', default: 3 })
  freeAttemptsRemaining!: number;

  @Column({ type: 'varchar', nullable: true })
  stripeCustomerId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripeSubscriptionId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  paypalSubscriptionId!: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  subscriptionProvider!: SubscriptionProvider | null;

  @Column({ type: 'varchar', nullable: true })
  subscriptionStatus!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionCurrentPeriodEnd!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
