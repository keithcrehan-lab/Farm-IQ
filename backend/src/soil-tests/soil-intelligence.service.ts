import { Injectable } from '@nestjs/common';
import { LandUse } from '../fields/field.entity';
import {
  BENEFIT_PER_HA_EUR,
  K_COST_PER_KG_EUR,
  K_KG_PER_HA_PER_INDEX_GAP,
  LAND_USE_LABEL,
  LIME_COST_PER_TONNE_EUR,
  LIME_CORRECTION_RATE_T_PER_HA,
  LIME_MAINTENANCE_RATE_T_PER_HA,
  P_COST_PER_KG_EUR,
  P_KG_PER_HA_PER_INDEX_GAP,
  PH_GAP_ACTION_THRESHOLD,
  PH_GAP_CORRECTION_THRESHOLD,
  PH_TARGET_BY_LAND_USE,
  TARGET_INDEX,
} from './constants/nutrient-targets.constants';

export interface SoilAnalysisInput {
  areaHa: number;
  landUse: LandUse;
  ph: number;
  pIndex: number;
  kIndex: number;
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

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function indexStatus(index: number): NutrientStatus {
  if (index < TARGET_INDEX) return 'low';
  if (index > TARGET_INDEX) return 'high';
  return 'target';
}

/**
 * Deterministic soil intelligence: turns a raw soil test into field-level
 * recommendations. This is the "rules calculate" half of FarmReturn's design —
 * it never calls an LLM and always returns the same output for the same input.
 * A future AI layer sits in front of this to explain results conversationally;
 * it should never be asked to recompute the numbers themselves.
 */
@Injectable()
export class SoilIntelligenceService {
  analyze(input: SoilAnalysisInput): SoilAnalysisResult {
    const { areaHa, landUse, ph, pIndex, kIndex } = input;
    const phTarget = PH_TARGET_BY_LAND_USE[landUse];
    const phGap = round(phTarget - ph, 2);
    const landUseLabel = LAND_USE_LABEL[landUse];

    const recommendations: NutrientRecommendation[] = [];

    if (phGap > PH_GAP_ACTION_THRESHOLD) {
      const rateTPerHa =
        phGap > PH_GAP_CORRECTION_THRESHOLD
          ? LIME_CORRECTION_RATE_T_PER_HA
          : LIME_MAINTENANCE_RATE_T_PER_HA;
      const quantityTonnes = round(rateTPerHa * areaHa, 1);
      recommendations.push({
        nutrient: 'lime',
        status: 'low',
        whatsWrong: `Soil pH is ${ph.toFixed(1)} — below the ${phTarget.toFixed(1)} target for ${landUseLabel}.`,
        whyItMatters:
          'Below-target pH limits how well applied phosphorus and nitrogen convert into grass or crop growth on this field.',
        whatToDo: `Apply ${quantityTonnes}t of ground lime (${rateTPerHa}t/ha) across the field.`,
        quantity: quantityTonnes,
        unit: 'tonnes',
        estimatedCostEur: round(quantityTonnes * LIME_COST_PER_TONNE_EUR),
        estimatedBenefitEur: round(areaHa * BENEFIT_PER_HA_EUR),
      });
    }

    const pStatus = indexStatus(pIndex);
    if (pStatus === 'low') {
      const gap = TARGET_INDEX - pIndex;
      const kgPerHa = gap * P_KG_PER_HA_PER_INDEX_GAP;
      const quantityKg = round(kgPerHa * areaHa);
      recommendations.push({
        nutrient: 'phosphorus',
        status: 'low',
        whatsWrong: `Soil phosphorus is at Index ${pIndex} — below the target Index ${TARGET_INDEX} for ${landUseLabel}.`,
        whyItMatters:
          'Phosphorus drives early root and tiller development — a deficit typically shows up as reduced yield.',
        whatToDo: `Apply approximately ${quantityKg}kg of phosphorus (about ${round(kgPerHa)}kg/ha) this season.`,
        quantity: quantityKg,
        unit: 'kg',
        estimatedCostEur: round(quantityKg * P_COST_PER_KG_EUR),
        estimatedBenefitEur: round(areaHa * BENEFIT_PER_HA_EUR),
      });
    }

    const kStatus = indexStatus(kIndex);
    if (kStatus === 'low') {
      const gap = TARGET_INDEX - kIndex;
      const kgPerHa = gap * K_KG_PER_HA_PER_INDEX_GAP;
      const quantityKg = round(kgPerHa * areaHa);
      recommendations.push({
        nutrient: 'potassium',
        status: 'low',
        whatsWrong: `Soil potassium is at Index ${kIndex} — below the target Index ${TARGET_INDEX} for ${landUseLabel}.`,
        whyItMatters:
          'Potassium supports grass regrowth after grazing or cutting — a deficit reduces recovery speed and winter hardiness.',
        whatToDo: `Apply approximately ${quantityKg}kg of potassium (about ${round(kgPerHa)}kg/ha) this season.`,
        quantity: quantityKg,
        unit: 'kg',
        estimatedCostEur: round(quantityKg * K_COST_PER_KG_EUR),
        estimatedBenefitEur: round(areaHa * BENEFIT_PER_HA_EUR),
      });
    }

    const totalEstimatedCostEur = round(
      recommendations.reduce((sum, rec) => sum + rec.estimatedCostEur, 0),
    );
    const totalEstimatedBenefitEur = round(
      recommendations.reduce((sum, rec) => sum + rec.estimatedBenefitEur, 0),
    );

    return {
      phTarget,
      phGap,
      pStatus,
      kStatus,
      recommendations,
      totalEstimatedCostEur,
      totalEstimatedBenefitEur,
    };
  }
}
