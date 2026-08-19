import { apiClient } from './client';
import type { NutrientCategory } from './groupBuy';
import type { NutrientRecommendation } from './soilTests';

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

export function getFertiliserPlan(farmId: string) {
  return apiClient.get<FertiliserPlan>(`/farms/${farmId}/fertiliser-plan`).then((r) => r.data);
}
