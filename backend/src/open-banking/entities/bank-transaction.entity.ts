import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/** Solo transacciones `booked` (MVP) — las `pending` de GoCardless no traen un id estable para deduplicar. */
@Entity('bank_transactions')
@Unique(['bankAccountId', 'externalTransactionId'])
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bankAccountId!: string;

  @Column({ type: 'varchar' })
  externalTransactionId!: string;

  @Column({ type: 'date', nullable: true })
  bookingDate!: string | null;

  /** TypeORM devuelve `numeric` como string para no perder precision con floats. */
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 8 })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  remittanceInfo!: string | null;

  @Column({ type: 'varchar', nullable: true })
  counterpartyName!: string | null;

  /** Objeto original completo de GoCardless, para el trabajo de categorizacion futuro. */
  @Column({ type: 'jsonb' })
  rawPayload!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
