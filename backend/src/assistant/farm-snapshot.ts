import { LandUse } from '../fields/field.entity';
import { SoilAnalysisResult } from '../soil-tests/soil-intelligence.service';
import { FertiliserPlan } from '../fertiliser-plan/fertiliser-plan.service';
import { HousingSummary } from '../livestock/housing-intelligence';
import { ProfitabilitySummary } from '../profitability/profitability-calculator';

export interface FieldSummary {
  name: string;
  areaHa: number;
  landUse: LandUse;
  latestSoilTest: { sampleDate: string; ph: number; pIndex: number; kIndex: number } | null;
  soilAnalysis: SoilAnalysisResult | null;
}

export interface RelevantGroupBuyOffer {
  productName: string;
  county: string | null;
  typicalPricePerTonneEur: number;
  negotiatedPricePerTonneEur: number;
  expiresAt: string;
}

/**
 * Everything the assistant is allowed to know about a farm, gathered fresh
 * on every question from the same rules engines the rest of the API uses —
 * never a separate or looser calculation. This is the "rules calculate"
 * half of the assistant; the model only ever interprets what's in here.
 */
export interface FarmSnapshot {
  farm: { name: string; county: string | null; farmType: string };
  fields: FieldSummary[];
  fertiliserPlan: FertiliserPlan;
  housing: HousingSummary;
  profitability: ProfitabilitySummary;
  nearbyGroupBuyOffers: RelevantGroupBuyOffer[];
}
