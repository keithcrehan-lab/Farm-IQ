import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Farm } from '../farms/farm.entity';
import { Enterprise } from './enterprise.entity';
import { Field } from '../fields/field.entity';
import { TransactionCategory } from './transaction-category.constants';

/**
 * One income or expense entry. `amountEur` is always stored positive —
 * whether it's revenue or a cost is derived from `category` via
 * CATEGORY_META, never from the sign of the amount, so there's exactly one
 * place (the metadata map) that decides what a category means.
 */
@Entity('transactions')
@Index(['farmId', 'transactionDate'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  /** Optional — which enterprise this belongs to, if assigned. */
  @ManyToOne(() => Enterprise, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Enterprise | null;

  @Column({ name: 'enterprise_id', nullable: true })
  enterpriseId: string | null;

  /** Optional — which field this belongs to, if assigned (drives return-per-hectare). */
  @ManyToOne(() => Field, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'field_id' })
  field: Field | null;

  @Column({ name: 'field_id', nullable: true })
  fieldId: string | null;

  @Column({ type: 'enum', enum: TransactionCategory })
  category: TransactionCategory;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'amount_eur' })
  amountEur: number;

  @Column({ type: 'date', name: 'transaction_date' })
  transactionDate: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
