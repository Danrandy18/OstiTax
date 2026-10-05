import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../auth/entities/account.entity';
import type { ReceiptCategory, VatRate } from '../receipt-parser';

/** Postgres devuelve numeric como texto: se convierte a number al leer. */
const decimal = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value == null ? null : Number(value),
};

/**
 * Recibo guardado en la cuenta. Minimizacion de datos (RGPD): solo los campos que el usuario
 * revisa y confirma; ni la imagen ni el texto del OCR llegan nunca al servidor. Se borra con
 * la cuenta (ON DELETE CASCADE).
 */
@Entity('receipts')
@Index(['accountId', 'date'])
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account?: Account;

  @Column({ type: 'varchar', length: 200, default: '' })
  merchant!: string;

  /** Fecha del recibo (AAAA-MM-DD); null si no se pudo leer. */
  @Column({ type: 'date', nullable: true })
  date!: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimal,
  })
  total!: number | null;

  @Column({ type: 'smallint', nullable: true })
  vatRate!: VatRate | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimal,
  })
  vatAmount!: number | null;

  @Column({ type: 'varchar', length: 100, default: '' })
  documentNumber!: string;

  @Column({ type: 'varchar', length: 32, default: 'other' })
  category!: ReceiptCategory;

  /** Bien de trabajo por encima del limite GWG: se amortiza (AfA) en varios anos. */
  @Column({ type: 'boolean', default: false })
  depreciation!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
