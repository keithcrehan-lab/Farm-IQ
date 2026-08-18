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

export enum Species {
  CATTLE = 'cattle',
  SHEEP = 'sheep',
}

export enum LivestockCategory {
  // Cattle
  COW = 'cow',
  BULL = 'bull',
  CALF = 'calf',
  WEANLING = 'weanling',
  REPLACEMENT_HEIFER = 'replacement_heifer',
  FINISHING = 'finishing',
  // Sheep
  EWE = 'ewe',
  RAM = 'ram',
  LAMB = 'lamb',
  HOGGET = 'hogget',
}

/** Every category belongs to exactly one species — derived server-side, never client-supplied. */
export const SPECIES_BY_CATEGORY: Record<LivestockCategory, Species> = {
  [LivestockCategory.COW]: Species.CATTLE,
  [LivestockCategory.BULL]: Species.CATTLE,
  [LivestockCategory.CALF]: Species.CATTLE,
  [LivestockCategory.WEANLING]: Species.CATTLE,
  [LivestockCategory.REPLACEMENT_HEIFER]: Species.CATTLE,
  [LivestockCategory.FINISHING]: Species.CATTLE,
  [LivestockCategory.EWE]: Species.SHEEP,
  [LivestockCategory.RAM]: Species.SHEEP,
  [LivestockCategory.LAMB]: Species.SHEEP,
  [LivestockCategory.HOGGET]: Species.SHEEP,
};

/**
 * A farm's headcount for one livestock category (e.g. 20 cows). This is
 * MVP-level category counting, not individual animal records — see spec
 * section 15 for the future per-animal model this deliberately doesn't build yet.
 */
@Entity('livestock_groups')
@Index(['farmId', 'category'], { unique: true })
export class LivestockGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ type: 'enum', enum: Species })
  species: Species;

  @Column({ type: 'enum', enum: LivestockCategory })
  category: LivestockCategory;

  @Column({ type: 'int', name: 'head_count' })
  headCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
