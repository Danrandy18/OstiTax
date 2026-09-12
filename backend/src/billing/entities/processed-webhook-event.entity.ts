import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SubscriptionProvider } from '../../users/enums/user-plan.enum';

/** Registro de eventos de webhook ya procesados, para no duplicar efectos si Stripe/PayPal reintentan la entrega. */
@Entity('processed_webhook_events')
@Unique(['provider', 'eventId'])
export class ProcessedWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 16 })
  provider!: SubscriptionProvider;

  @Column({ type: 'varchar' })
  eventId!: string;

  @CreateDateColumn()
  processedAt!: Date;
}
