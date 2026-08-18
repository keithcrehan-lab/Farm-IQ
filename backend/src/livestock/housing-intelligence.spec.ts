import { BuildingType } from './building.entity';
import { LivestockCategory, Species } from './livestock-group.entity';
import { summarizeHousing } from './housing-intelligence';

describe('summarizeHousing', () => {
  it('matches the Livestock & Housing mockup: 71 cattle projected vs 64 spaces capacity = shortfall of 7', () => {
    const buildings = [
      { id: '1', name: 'Shed 1', type: BuildingType.SLATTED, capacityHead: 32 },
      { id: '2', name: 'Shed 2', type: BuildingType.CALVING, capacityHead: 8 },
      { id: '3', name: 'Shed 3', type: BuildingType.LOOSE_HOUSING, capacityHead: 20 },
      { id: '4', name: 'Shed 4', type: BuildingType.STRAW_BEDDED, capacityHead: 4 },
    ];
    const groups = [
      { category: LivestockCategory.COW, species: Species.CATTLE, headCount: 20 },
      { category: LivestockCategory.BULL, species: Species.CATTLE, headCount: 1 },
      { category: LivestockCategory.CALF, species: Species.CATTLE, headCount: 15 },
      { category: LivestockCategory.WEANLING, species: Species.CATTLE, headCount: 5 },
      { category: LivestockCategory.REPLACEMENT_HEIFER, species: Species.CATTLE, headCount: 8 },
      { category: LivestockCategory.FINISHING, species: Species.CATTLE, headCount: 22 },
    ];

    const result = summarizeHousing(buildings, groups);

    expect(result.projectedWinterStockHead).toBe(71);
    expect(result.totalCapacityHead).toBe(64);
    expect(result.shortfallHead).toBe(7);
    expect(result.status).toBe('shortfall');
    expect(result.message).toContain('exceeds registered housing capacity');
    expect(result.cattleCategoryBreakdown).toHaveLength(6);
  });

  it('excludes sheep from the projected winter stock and capacity check', () => {
    const buildings = [{ id: '1', name: 'Shed 1', type: BuildingType.SLATTED, capacityHead: 10 }];
    const groups = [
      { category: LivestockCategory.COW, species: Species.CATTLE, headCount: 8 },
      { category: LivestockCategory.EWE, species: Species.SHEEP, headCount: 200 },
    ];

    const result = summarizeHousing(buildings, groups);

    expect(result.projectedWinterStockHead).toBe(8);
    expect(result.cattleCategoryBreakdown).toEqual([
      { category: LivestockCategory.COW, headCount: 8 },
    ]);
  });

  it('reports sufficient status and zero shortfall when capacity covers stock', () => {
    const buildings = [{ id: '1', name: 'Shed 1', type: BuildingType.SLATTED, capacityHead: 50 }];
    const groups = [{ category: LivestockCategory.COW, species: Species.CATTLE, headCount: 20 }];

    const result = summarizeHousing(buildings, groups);

    expect(result.status).toBe('sufficient');
    expect(result.shortfallHead).toBe(0);
    expect(result.message).toContain('covers your projected winter stock');
  });

  it('handles a farm with no buildings registered yet without throwing', () => {
    const groups = [{ category: LivestockCategory.COW, species: Species.CATTLE, headCount: 5 }];
    const result = summarizeHousing([], groups);

    expect(result.totalCapacityHead).toBe(0);
    expect(result.shortfallHead).toBe(5);
    expect(result.status).toBe('shortfall');
  });
});
