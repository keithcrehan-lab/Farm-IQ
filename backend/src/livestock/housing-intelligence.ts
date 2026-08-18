import { BuildingType } from './building.entity';
import { LivestockCategory, Species } from './livestock-group.entity';

export interface HousingInputBuilding {
  id: string;
  name: string;
  type: BuildingType;
  capacityHead: number;
}

export interface HousingInputGroup {
  category: LivestockCategory;
  species: Species;
  headCount: number;
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
  buildings: HousingInputBuilding[];
  cattleCategoryBreakdown: CategoryBreakdownEntry[];
}

/**
 * Deterministic winter housing capacity check: projected cattle numbers vs
 * registered shed capacity. Pure and DB-free, same shape as
 * SoilIntelligenceService — no model call, always the same output for the
 * same input.
 *
 * Scoped to cattle only: sheep are conventionally out-wintered on Irish
 * farms rather than housed, so sheep headcount isn't counted against shed
 * capacity here. If a farm does house sheep, that's a gap to revisit rather
 * than something silently assumed away — flagged here in code, not guessed
 * at in the numbers.
 */
export function summarizeHousing(
  buildings: HousingInputBuilding[],
  livestockGroups: HousingInputGroup[],
): HousingSummary {
  const cattleGroups = livestockGroups.filter((group) => group.species === Species.CATTLE);

  const cattleCategoryBreakdown: CategoryBreakdownEntry[] = cattleGroups.map((group) => ({
    category: group.category,
    headCount: group.headCount,
  }));

  const projectedWinterStockHead = cattleGroups.reduce((sum, group) => sum + group.headCount, 0);
  const totalCapacityHead = buildings.reduce((sum, building) => sum + building.capacityHead, 0);
  const shortfallHead = Math.max(0, projectedWinterStockHead - totalCapacityHead);
  const status: HousingSummary['status'] = shortfallHead > 0 ? 'shortfall' : 'sufficient';

  const message =
    status === 'shortfall'
      ? `Projected winter stock (${projectedWinterStockHead} head) exceeds registered housing capacity (${totalCapacityHead} spaces) by ${shortfallHead}.`
      : `Registered housing capacity (${totalCapacityHead} spaces) covers your projected winter stock (${projectedWinterStockHead} head).`;

  return {
    projectedWinterStockHead,
    totalCapacityHead,
    shortfallHead,
    status,
    message,
    buildings,
    cattleCategoryBreakdown,
  };
}
