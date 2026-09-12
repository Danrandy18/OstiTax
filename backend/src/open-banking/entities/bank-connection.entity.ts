import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BankConnectionStatus } from '../enums/bank-connection-status.enum';

@Entity('bank_connections')
export class BankConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  accountId!: string;

  /** Generado por nosotros (`${accountId}.${randomUUID()}`), GoCardless lo devuelve tal cual en el redirect (`?ref=`). */
  @Column({ type: 'varchar', unique: true })
  reference!: string;

  @Column({ type: 'varchar', nullable: true })
  requisitionId!: string | null;

  @Column({ type: 'varchar' })
  institutionId!: string;

  @Column({ type: 'varchar', nullable: true })
  institutionName!: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: BankConnectionStatus.PENDING,
  })
  status!: BankConnectionStatus;

  @Column({ type: 'varchar', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
