import { apiClient } from './client';

export type NutrientCategory = 'lime' | 'phosphorus' | 'potassium' | 'nitrogen';

export interface GroupBuyOffer {
  id: string;
  productName: string;
  fertiliserProductCategory: NutrientCategory | null;
  county: string | null;
  typicalPricePerTonneEur: number;
  negotiatedPricePerTonneEur: number;
  supplierThresholdTonnes: number;
  expiresAt: string;
  createdAt: string;
}

export interface OfferProgress {
  totalCommittedTonnes: number;
  participantCount: number;
  thresholdTonnes: number;
  progressPct: number;
  thresholdMet: boolean;
}

export interface PersonalizedOffer {
  requirementTonnes: number;
  savingPerTonneEur: number;
  typicalCostEur: number;
  negotiatedCostEur: number;
  estimatedSavingEur: number;
}

export interface FarmOfferView {
  offer: GroupBuyOffer;
  progress: OfferProgress;
  isExpired: boolean;
  requirementSource: 'fertiliser_plan' | 'manual' | 'unknown';
  personalized: PersonalizedOffer | null;
  alreadyJoined: boolean;
  joinedQuantityTonnes: number | null;
}

/** `numeric` pricing/threshold columns come back as strings on raw reads — see soilTests.ts for the general note. */
function normalizeOffer(offer: GroupBuyOffer): GroupBuyOffer {
  return {
    ...offer,
    typicalPricePerTonneEur: Number(offer.typicalPricePerTonneEur),
    negotiatedPricePerTonneEur: Number(offer.negotiatedPricePerTonneEur),
    supplierThresholdTonnes: Number(offer.supplierThresholdTonnes),
  };
}

export function listGroupBuyOffers() {
  return apiClient.get<GroupBuyOffer[]>('/group-buy-offers').then((r) => r.data.map(normalizeOffer));
}

export function getFarmOfferView(farmId: string, offerId: string) {
  return apiClient
    .get<FarmOfferView>(`/farms/${farmId}/group-buy-offers/${offerId}`)
    .then((r) => ({ ...r.data, offer: normalizeOffer(r.data.offer) }));
}

export function joinGroupBuyOffer(farmId: string, offerId: string, quantityTonnes?: number) {
  return apiClient
    .put<{ id: string; offerId: string; farmId: string; quantityTonnes: number; joinedAt: string }>(
      `/farms/${farmId}/group-buy-offers/${offerId}/join`,
      quantityTonnes !== undefined ? { quantityTonnes } : {},
    )
    .then((r) => r.data);
}

export function leaveGroupBuyOffer(farmId: string, offerId: string) {
  return apiClient.delete<void>(`/farms/${farmId}/group-buy-offers/${offerId}/join`);
}
