import { LandUse } from '../../fields/field.entity';

/**
 * Heuristic agronomic + cost constants for the soil intelligence rules engine.
 *
 * These follow the shape of Teagasc-style soil fertility guidance (pH targets by
 * land use, a 1–4 nutrient index scale targeting index 3) but the rates, costs and
 * benefit figures below are first-pass placeholders for the MVP — not calibrated
 * agronomic advice. Before this ships to a real farm they need review against
 * current Teagasc Nutrient Advice / Green Book tables and real input pricing.
 * The "rules calculate, AI interprets" split means this module owns the numbers;
 * a future AI layer explains them in the farmer's context, it doesn't invent them.
 */

export const TARGET_INDEX = 3;

export const PH_TARGET_BY_LAND_USE: Record<LandUse, number> = {
  [LandUse.TILLAGE]: 6.5,
  [LandUse.SILAGE]: 6.3,
  [LandUse.GRAZING]: 6.3,
  [LandUse.ROUGH_GRAZING]: 5.8,
  [LandUse.OTHER]: 6.3,
};

/** Below this pH gap (target − actual) no lime is recommended. */
export const PH_GAP_ACTION_THRESHOLD = 0.05;
/** Above this gap a full correction dressing is used instead of a maintenance one. */
export const PH_GAP_CORRECTION_THRESHOLD = 0.3;

export const LIME_MAINTENANCE_RATE_T_PER_HA = 2.5;
export const LIME_CORRECTION_RATE_T_PER_HA = 5;
export const LIME_COST_PER_TONNE_EUR = 32;

export const P_KG_PER_HA_PER_INDEX_GAP = 15;
export const P_COST_PER_KG_EUR = 1.3;

export const K_KG_PER_HA_PER_INDEX_GAP = 30;
export const K_COST_PER_KG_EUR = 0.75;

/** Flat estimated financial benefit per hectare of correcting one nutrient — see note above. */
export const BENEFIT_PER_HA_EUR = 250;

export const LAND_USE_LABEL: Record<LandUse, string> = {
  [LandUse.TILLAGE]: 'tillage',
  [LandUse.SILAGE]: 'a silage crop',
  [LandUse.GRAZING]: 'grazing',
  [LandUse.ROUGH_GRAZING]: 'rough grazing',
  [LandUse.OTHER]: 'this enterprise',
};
