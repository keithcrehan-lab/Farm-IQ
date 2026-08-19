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
import { Farm } from '../farms/farm.entity';
import { LivestockCategory, Species } from '../livestock/livestock-group.entity';

export enum AnimalSex {
  MALE = 'male',
  FEMALE = 'female',
}

export enum AnimalStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  DIED = 'died',
}

/**
 * A single higher-value animal's record — spec section 15. Deliberately
 * separate from LivestockGroup (aggregate category counts, e.g. "20 cows"):
 * a farm can record category totals, individual animals, or both, and this
 * API makes no attempt to reconcile the two into one number — the spec
 * itself frames individual records as growing alongside category counts,
 * not replacing them.
 *
 * Dam/sire are free-text tag references, not foreign keys: a sire is very
 * often an external AI bull with no record of its own on this farm, and
 * forcing every dam/sire into a registered Animal would make entry
 * needlessly rigid for the common case.
 */
@Entity('animals')
@Index(['farmId', 'tagNumber'], { unique: true })
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ name: 'tag_number' })
  tagNumber: string;

  @Column({ type: 'enum', enum: Species })
  species: Species;

  @Column({ type: 'enum', enum: LivestockCategory })
  category: LivestockCategory;

  @Column({ type: 'varchar', nullable: true })
  breed: string | null;

  @Column({ type: 'enum', enum: AnimalSex })
  sex: AnimalSex;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', name: 'dam_tag_number', nullable: true })
  damTagNumber: string | null;

  @Column({ type: 'varchar', name: 'sire_tag_number', nullable: true })
  sireTagNumber: string | null;

  @Column({ type: 'date', name: 'purchase_date', nullable: true })
  purchaseDate: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'purchase_price_eur', nullable: true })
  purchasePriceEur: number | null;

  /** Farmer-set finishing target — the honest basis for a "near target weight" alert; never inferred. */
  @Column({ type: 'numeric', precision: 6, scale: 1, name: 'target_weight_kg', nullable: true })
  targetWeightKg: number | null;

  @Column({ type: 'enum', enum: AnimalStatus, default: AnimalStatus.ACTIVE })
  status: AnimalStatus;

  @Column({ type: 'date', name: 'sale_date', nullable: true })
  saleDate: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 1, name: 'sale_weight_kg', nullable: true })
  saleWeightKg: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'sale_price_eur', nullable: true })
  salePriceEur: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
