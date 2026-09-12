import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  connectionId!: string;

  /** Id de cuenta de GoCardless (un requisition puede devolver varias). */
  @Column({ type: 'varchar', unique: true })
  externalAccountId!: string;

  @Column({ type: 'varchar', nullable: true })
  iban!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  currency!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ownerName!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
