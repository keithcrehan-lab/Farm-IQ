import { apiClient } from './client';

export type Species = 'cattle' | 'sheep';

export type LivestockCategory =
  | 'cow'
  | 'bull'
  | 'calf'
  | 'weanling'
  | 'replacement_heifer'
  | 'finishing'
  | 'ewe'
  | 'ram'
  | 'lamb'
  | 'hogget';

export const SPECIES_BY_CATEGORY: Record<LivestockCategory, Species> = {
  cow: 'cattle',
  bull: 'cattle',
  calf: 'cattle',
  weanling: 'cattle',
  replacement_heifer: 'cattle',
  finishing: 'cattle',
  ewe: 'sheep',
  ram: 'sheep',
  lamb: 'sheep',
  hogget: 'sheep',
};

export const LIVESTOCK_CATEGORY_LABEL: Record<LivestockCategory, string> = {
  cow: 'Cows',
  bull: 'Bulls',
  calf: 'Calves',
  weanling: 'Weanlings',
  replacement_heifer: 'Replacement heifers',
  finishing: 'Finishing cattle',
  ewe: 'Ewes',
  ram: 'Rams',
  lamb: 'Lambs',
  hogget: 'Hoggets',
};

export interface LivestockGroup {
  id: string;
  farmId: string;
  species: Species;
  category: LivestockCategory;
  headCount: number;
  createdAt: string;
  updatedAt: string;
}

export type BuildingType = 'slatted' | 'calving' | 'loose_housing' | 'straw_bedded' | 'other';

export interface Building {
  id: string;
  farmId: string;
  name: string;
  type: BuildingType;
  capacityHead: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBreakdownEntry {
  category: LivestockCategory;
  headCount: number;
}

export interface HousingSummary {
  projectedWinterStockHead: number;
  totalCapacityHead: number;
  shortfallHead: number;
  status: 'shortfall' | 'sufficient';
  message: string;
  buildings: Building[];
  cattleCategoryBreakdown: CategoryBreakdownEntry[];
}

export function listLivestockGroups(farmId: string) {
  return apiClient.get<LivestockGroup[]>(`/farms/${farmId}/livestock-groups`).then((r) => r.data);
}

export function upsertLivestockGroup(farmId: string, category: LivestockCategory, headCount: number) {
  return apiClient
    .put<LivestockGroup>(`/farms/${farmId}/livestock-groups`, { category, headCount })
    .then((r) => r.data);
}

export function removeLivestockGroup(farmId: string, groupId: string) {
  return apiClient.delete<void>(`/farms/${farmId}/livestock-groups/${groupId}`);
}

export function getHousingSummary(farmId: string) {
  return apiClient.get<HousingSummary>(`/farms/${farmId}/housing-summary`).then((r) => r.data);
}
