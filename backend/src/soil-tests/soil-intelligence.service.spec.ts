import { LandUse } from '../fields/field.entity';
import { SoilIntelligenceService } from './soil-intelligence.service';

describe('SoilIntelligenceService', () => {
  const service = new SoilIntelligenceService();

  it('recommends nothing when pH and both indices are on target', () => {
    const result = service.analyze({
      areaHa: 5,
      landUse: LandUse.GRAZING,
      ph: 6.3,
      pIndex: 3,
      kIndex: 3,
    });

    expect(result.recommendations).toHaveLength(0);
    expect(result.totalEstimatedCostEur).toBe(0);
    expect(result.totalEstimatedBenefitEur).toBe(0);
  });

  it('matches the Field 04 mockup: pH 6.2 on a 6.4ha grazing field needs a maintenance lime dressing', () => {
    const result = service.analyze({
      areaHa: 6.4,
      landUse: LandUse.GRAZING,
      ph: 6.2,
      pIndex: 3,
      kIndex: 3,
    });

    expect(result.phTarget).toBe(6.3);
    expect(result.phGap).toBeCloseTo(0.1, 5);

    const lime = result.recommendations.find((r) => r.nutrient === 'lime');
    expect(lime).toBeDefined();
    expect(lime!.quantity).toBe(16); // 2.5 t/ha maintenance rate * 6.4ha
    expect(lime!.unit).toBe('tonnes');
    expect(lime!.estimatedCostEur).toBe(512); // 16t * €32/t

    // pH already on/near target for P and K — no P or K recommendation expected.
    expect(result.recommendations.find((r) => r.nutrient === 'phosphorus')).toBeUndefined();
    expect(result.recommendations.find((r) => r.nutrient === 'potassium')).toBeUndefined();
  });

  it('escalates to a full correction dressing when the pH gap is large', () => {
    const result = service.analyze({
      areaHa: 4,
      landUse: LandUse.GRAZING,
      ph: 5.5,
      pIndex: 3,
      kIndex: 3,
    });

    const lime = result.recommendations.find((r) => r.nutrient === 'lime');
    expect(lime!.quantity).toBe(20); // 5 t/ha correction rate * 4ha
  });

  it('flags low phosphorus and potassium together with proportional quantities', () => {
    const result = service.analyze({
      areaHa: 5.6,
      landUse: LandUse.GRAZING,
      ph: 6.0, // below 6.3 target too, so lime is also recommended
      pIndex: 2,
      kIndex: 3,
    });

    const phosphorus = result.recommendations.find((r) => r.nutrient === 'phosphorus');
    expect(phosphorus).toBeDefined();
    expect(phosphorus!.status).toBe('low');
    // gap of 1 index point * 15kg/ha * 5.6ha = 84kg
    expect(phosphorus!.quantity).toBe(84);
    expect(phosphorus!.unit).toBe('kg');

    expect(result.recommendations.find((r) => r.nutrient === 'potassium')).toBeUndefined();
    expect(result.totalEstimatedCostEur).toBe(
      result.recommendations.reduce((sum, r) => sum + r.estimatedCostEur, 0),
    );
  });
});
