import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FertiliserProduct, NutrientCategory } from './fertiliser-product.entity';
import { nutrientRequirementToProductTonnes } from './fertiliser-conversion';
import { FarmsService } from '../farms/farms.service';
import { FieldsService } from '../fields/fields.service';
import { SoilTestsService } from '../soil-tests/soil-tests.service';
import {
  NutrientRecommendation,
  SoilIntelligenceService,
} from '../soil-tests/soil-intelligence.service';

export interface FieldPlanEntry {
  fieldId: string;
  fieldName: string;
  areaHa: number;
  soilTestDate: string;
  recommendations: NutrientRecommendation[];
}

export interface FieldMissingSoilTest {
  fieldId: string;
  fieldName: string;
}

export interface ProductRequirement {
  productId: string;
  productName: string;
  category: NutrientCategory;
  quantityTonnes: number;
  pricePerTonneEur: number;
  estimatedCostEur: number;
}

export interface FertiliserPlan {
  farmId: string;
  generatedAt: string;
  products: ProductRequirement[];
  totalEstimatedCostEur: number;
  totalEstimatedBenefitEur: number;
  fieldBreakdown: FieldPlanEntry[];
  fieldsMissingSoilTests: FieldMissingSoilTest[];
  notes: string[];
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Aggregates every field's soil-driven nutrient requirement into one whole-farm
 * purchasing plan. This is a thin orchestration layer over
 * SoilIntelligenceService — it does not add new agronomic logic of its own,
 * only unit conversion (kg of a nutrient -> tonnes of a specific product) and
 * summation across fields.
 *
 * Deliberately covers lime, phosphorus and potassium only. Nitrogen planning
 * (protected urea, CAN, ...) is intentionally NOT included: nitrogen
 * requirement isn't derivable from a soil test the way pH/P/K are — it depends
 * on stocking rate, grassland N index and the farm's nitrates-regulation
 * limits, none of which this API models yet. Adding it means building that
 * model first, not guessing a number here.
 */
@Injectable()
export class FertiliserPlanService {
  constructor(
    @InjectRepository(FertiliserProduct)
    private readonly productsRepository: Repository<FertiliserProduct>,
    private readonly farmsService: FarmsService,
    private readonly fieldsService: FieldsService,
    private readonly soilTestsService: SoilTestsService,
    private readonly soilIntelligenceService: SoilIntelligenceService,
  ) {}

  async generateForFarm(farmId: string, ownerId: string): Promise<FertiliserPlan> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const fields = await this.fieldsService.findAllForFarm(farmId, ownerId);

    const fieldBreakdown: FieldPlanEntry[] = [];
    const fieldsMissingSoilTests: FieldMissingSoilTest[] = [];

    for (const field of fields) {
      const latestTest = await this.soilTestsService.findLatestForFieldUnchecked(field.id);
      if (!latestTest) {
        fieldsMissingSoilTests.push({ fieldId: field.id, fieldName: field.name });
        continue;
      }

      const analysis = this.soilIntelligenceService.analyze({
        areaHa: Number(field.areaHa),
        landUse: field.landUse,
        ph: Number(latestTest.ph),
        pIndex: latestTest.pIndex,
        kIndex: latestTest.kIndex,
      });

      if (analysis.recommendations.length > 0) {
        fieldBreakdown.push({
          fieldId: field.id,
          fieldName: field.name,
          areaHa: Number(field.areaHa),
          soilTestDate: latestTest.sampleDate,
          recommendations: analysis.recommendations,
        });
      }
    }

    const nutrientTotals = this.sumNutrientNeeds(fieldBreakdown);
    const products = await this.convertToProducts(nutrientTotals);

    const totalEstimatedCostEur = round(products.reduce((sum, p) => sum + p.estimatedCostEur, 0));
    const totalEstimatedBenefitEur = round(
      fieldBreakdown.reduce(
        (sum, entry) => sum + entry.recommendations.reduce((s, r) => s + r.estimatedBenefitEur, 0),
        0,
      ),
    );

    const notes = [
      'Nitrogen products (protected urea, CAN, ...) are not included — nitrogen requirement depends on stocking rate and grassland N index, which this API does not model yet.',
    ];

    return {
      farmId,
      generatedAt: new Date().toISOString(),
      products,
      totalEstimatedCostEur,
      totalEstimatedBenefitEur,
      fieldBreakdown,
      fieldsMissingSoilTests,
      notes,
    };
  }

  private sumNutrientNeeds(fieldBreakdown: FieldPlanEntry[]): Record<NutrientCategory, number> {
    const totals: Record<NutrientCategory, number> = {
      [NutrientCategory.LIME]: 0,
      [NutrientCategory.PHOSPHORUS]: 0,
      [NutrientCategory.POTASSIUM]: 0,
      [NutrientCategory.NITROGEN]: 0,
    };

    for (const entry of fieldBreakdown) {
      for (const rec of entry.recommendations) {
        if (rec.nutrient === 'lime') {
          // Lime recommendations are already expressed in tonnes of product.
          totals[NutrientCategory.LIME] += rec.quantity;
        } else if (rec.nutrient === 'phosphorus') {
          totals[NutrientCategory.PHOSPHORUS] += rec.quantity; // kg of elemental P
        } else if (rec.nutrient === 'potassium') {
          totals[NutrientCategory.POTASSIUM] += rec.quantity; // kg of elemental K
        }
      }
    }

    return totals;
  }

  private async convertToProducts(
    totals: Record<NutrientCategory, number>,
  ): Promise<ProductRequirement[]> {
    const products: ProductRequirement[] = [];

    for (const category of [
      NutrientCategory.LIME,
      NutrientCategory.PHOSPHORUS,
      NutrientCategory.POTASSIUM,
    ]) {
      const requiredAmount = totals[category];
      if (requiredAmount <= 0) continue;

      const product = await this.productsRepository.findOne({
        where: { category, isDefault: true },
      });
      if (!product) continue; // no catalog product configured for this nutrient yet

      const quantityTonnes = nutrientRequirementToProductTonnes(category, requiredAmount, {
        nitrogenPct: Number(product.nitrogenPct),
        phosphorusPct: Number(product.phosphorusPct),
        potassiumPct: Number(product.potassiumPct),
      });

      if (quantityTonnes <= 0) continue;

      products.push({
        productId: product.id,
        productName: product.name,
        category,
        quantityTonnes,
        pricePerTonneEur: Number(product.pricePerTonneEur),
        estimatedCostEur: round(quantityTonnes * Number(product.pricePerTonneEur)),
      });
    }

    return products;
  }
}
