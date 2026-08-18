import { NutrientCategory } from './fertiliser-product.entity';

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** The percentage columns on FertiliserProduct that matter for conversion. */
export interface ProductAnalysis {
  nitrogenPct: number;
  phosphorusPct: number;
  potassiumPct: number;
}

function nutrientPctForCategory(product: ProductAnalysis, category: NutrientCategory): number {
  switch (category) {
    case NutrientCategory.PHOSPHORUS:
      return product.phosphorusPct;
    case NutrientCategory.POTASSIUM:
      return product.potassiumPct;
    case NutrientCategory.NITROGEN:
      return product.nitrogenPct;
    default:
      return 0;
  }
}

/**
 * Converts a farm-level nutrient requirement into a purchasing quantity.
 *
 * Lime is already expressed in tonnes of product by SoilIntelligenceService, so
 * it passes through unchanged. Phosphorus and potassium are expressed in kg of
 * the elemental nutrient, converted via the chosen product's analysis: tonnes =
 * kg / (pct% of 1000kg/tonne) = kg / (pct * 10).
 *
 * Returns 0 (never negative, never NaN) if the category has no meaningful
 * conversion — e.g. a 0% analysis for that nutrient on the given product.
 */
export function nutrientRequirementToProductTonnes(
  category: NutrientCategory,
  requiredAmount: number,
  product: ProductAnalysis,
): number {
  if (requiredAmount <= 0) return 0;

  if (category === NutrientCategory.LIME) {
    return round(requiredAmount, 1);
  }

  const pct = nutrientPctForCategory(product, category);
  if (pct <= 0) return 0;

  return round(requiredAmount / (pct * 10), 2);
}
