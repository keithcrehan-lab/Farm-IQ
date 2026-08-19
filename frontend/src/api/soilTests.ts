import { apiClient } from './client';

export interface SoilTest {
  id: string;
  fieldId: string;
  sampleDate: string;
  labName: string | null;
  ph: number;
  pIndex: number;
  kIndex: number;
  mgIndex: number | null;
  organicMatterPct: number | null;
  createdAt: string;
}

export type NutrientStatus = 'low' | 'target' | 'high';

export interface NutrientRecommendation {
  nutrient: 'lime' | 'phosphorus' | 'potassium';
  status: NutrientStatus;
  whatsWrong: string;
  whyItMatters: string;
  whatToDo: string;
  quantity: number;
  unit: 'tonnes' | 'kg';
  estimatedCostEur: number;
  estimatedBenefitEur: number;
}

export interface SoilAnalysisResult {
  phTarget: number;
  phGap: number;
  pStatus: NutrientStatus;
  kStatus: NutrientStatus;
  recommendations: NutrientRecommendation[];
  totalEstimatedCostEur: number;
  totalEstimatedBenefitEur: number;
}

/**
 * TypeORM returns `numeric`-typed columns as strings over the wire (node-postgres's
 * default, to avoid float precision loss) — `ph` and `organicMatterPct` are `numeric`
 * columns, so raw list/get responses carry them as strings despite the declared type.
 * `pIndex`/`kIndex`/`mgIndex` are `int` columns and come back as real numbers already.
 * Coerced once here so every consumer gets the real numbers the type promises.
 */
function normalizeSoilTest(test: SoilTest): SoilTest {
  return {
    ...test,
    ph: Number(test.ph),
    organicMatterPct: test.organicMatterPct !== null ? Number(test.organicMatterPct) : null,
  };
}

export function listSoilTests(farmId: string, fieldId: string) {
  return apiClient
    .get<SoilTest[]>(`/farms/${farmId}/fields/${fieldId}/soil-tests`)
    .then((r) => r.data.map(normalizeSoilTest));
}

export function analyzeSoilTest(farmId: string, fieldId: string, testId: string) {
  return apiClient
    .get<SoilAnalysisResult>(`/farms/${farmId}/fields/${fieldId}/soil-tests/${testId}/analysis`)
    .then((r) => r.data);
}
