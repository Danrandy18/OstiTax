import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SubscriptionProvider,
  UserPlan,
} from '../../users/enums/user-plan.enum';

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

  @Column({ type: 'varchar', nullable: true })
  passwordResetTokenHash!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiresAt!: Date | null;

  /** Idioma de la UI (de, en, tr, bcs, es, uk): los correos se envian en este idioma. */
  @Column({ type: 'varchar', length: 8, default: 'de' })
  locale!: string;

  /** Los tokens emitidos antes de esta fecha dejan de valer (cierre de sesion en otros equipos). */
  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt!: Date | null;

  /** Evita enviar dos veces la bienvenida a Pro si llegan webhooks duplicados o casi a la vez. */
  @Column({ type: 'timestamptz', nullable: true })
  proWelcomeSentAt!: Date | null;

  /** El usuario cancelo: Pro sigue hasta subscriptionCurrentPeriodEnd y no se renueva. */
  @Column({ type: 'boolean', default: false })
  subscriptionCancelAtPeriodEnd!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
