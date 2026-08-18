import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum NutrientCategory {
  LIME = 'lime',
  PHOSPHORUS = 'phosphorus',
  POTASSIUM = 'potassium',
  NITROGEN = 'nitrogen',
}

/**
 * Reference catalog of purchasable products, one per nutrient category, used to
 * convert a farm's aggregate nutrient requirement (kg P, kg K, tonnes lime — from
 * SoilIntelligenceService) into a purchasing quantity and cost.
 *
 * `isDefault` marks which product represents a category when a farmer hasn't
 * picked an alternative — exactly one row per category should be default. This
 * table is seeded by migration, not exposed for CRUD yet; a future iteration can
 * let farmers/suppliers manage it and pick between products per category.
 *
 * No NITROGEN rows are seeded yet — see FertiliserPlanService for why.
 */
@Entity('fertiliser_products')
export class FertiliserProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: NutrientCategory })
  category: NutrientCategory;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'nitrogen_pct', default: 0 })
  nitrogenPct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'phosphorus_pct', default: 0 })
  phosphorusPct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'potassium_pct', default: 0 })
  potassiumPct: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'price_per_tonne_eur' })
  pricePerTonneEur: number;

  @Column({ name: 'is_default', default: true })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
