import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionProvider, UserPlan } from '../../users/enums/user-plan.enum';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  googleId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 16, default: UserPlan.FREE })
  plan!: UserPlan;

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
