export interface OfferPricing {
  typicalPricePerTonneEur: number;
  negotiatedPricePerTonneEur: number;
}

export interface PersonalizedOffer {
  requirementTonnes: number;
  savingPerTonneEur: number;
  typicalCostEur: number;
  negotiatedCostEur: number;
  estimatedSavingEur: number;
}

export interface OfferProgress {
  totalCommittedTonnes: number;
  participantCount: number;
  thresholdTonnes: number;
  progressPct: number;
  thresholdMet: boolean;
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function computeSavingPerTonne(pricing: OfferPricing): number {
  return round(pricing.typicalPricePerTonneEur - pricing.negotiatedPricePerTonneEur, 2);
}

/**
 * The farmer-facing offer card's numbers — deterministic arithmetic over the
 * offer's pricing and the farm's requirement (auto-filled from the
 * fertiliser plan where possible, otherwise farmer-supplied). No AI, no
 * fabricated numbers: this is the "rules calculate" half of the group-buy
 * feature.
 */
export function personalizeOffer(
  pricing: OfferPricing,
  requirementTonnes: number,
): PersonalizedOffer {
  const savingPerTonneEur = computeSavingPerTonne(pricing);
  return {
    requirementTonnes,
    savingPerTonneEur,
    typicalCostEur: round(requirementTonnes * pricing.typicalPricePerTonneEur),
    negotiatedCostEur: round(requirementTonnes * pricing.negotiatedPricePerTonneEur),
    estimatedSavingEur: round(requirementTonnes * savingPerTonneEur),
  };
}

export function computeOfferProgress(
  participantQuantitiesTonnes: number[],
  thresholdTonnes: number,
): OfferProgress {
  const totalCommittedTonnes = round(
    participantQuantitiesTonnes.reduce((sum, q) => sum + q, 0),
    2,
  );
  const progressPct =
    thresholdTonnes > 0 ? round((totalCommittedTonnes / thresholdTonnes) * 100, 1) : 0;

  return {
    totalCommittedTonnes,
    participantCount: participantQuantitiesTonnes.length,
    thresholdTonnes,
    progressPct,
    thresholdMet: totalCommittedTonnes >= thresholdTonnes,
  };
}

export function isOfferExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
