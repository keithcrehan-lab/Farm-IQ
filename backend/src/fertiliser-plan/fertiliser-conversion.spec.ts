import { NutrientCategory } from './fertiliser-product.entity';
import { nutrientRequirementToProductTonnes } from './fertiliser-conversion';

describe('nutrientRequirementToProductTonnes', () => {
  it('passes lime through unchanged (already tonnes), rounded to 1 decimal', () => {
    expect(
      nutrientRequirementToProductTonnes(NutrientCategory.LIME, 16, {
        nitrogenPct: 0,
        phosphorusPct: 0,
        potassiumPct: 0,
      }),
    ).toBe(16);
  });

  it('converts kg of phosphorus into tonnes of a 20%-P product', () => {
    // 84kg P / (20% * 1000kg/t) = 0.42t — matches the Field 08 scenario used
    // in the fertiliser plan endpoint smoke test.
    const tonnes = nutrientRequirementToProductTonnes(NutrientCategory.PHOSPHORUS, 84, {
      nitrogenPct: 0,
      phosphorusPct: 20,
      potassiumPct: 0,
    });
    expect(tonnes).toBeCloseTo(0.42, 5);
  });

  it('converts kg of potassium into tonnes of a 50%-K product', () => {
    const tonnes = nutrientRequirementToProductTonnes(NutrientCategory.POTASSIUM, 133, {
      nitrogenPct: 0,
      phosphorusPct: 0,
      potassiumPct: 50,
    });
    expect(tonnes).toBeCloseTo(0.27, 5); // 133 / 500 = 0.266 -> rounds to 0.27
  });

  it('returns 0 rather than dividing by zero when the product has no analysis for that nutrient', () => {
    const tonnes = nutrientRequirementToProductTonnes(NutrientCategory.PHOSPHORUS, 84, {
      nitrogenPct: 0,
      phosphorusPct: 0,
      potassiumPct: 50,
    });
    expect(tonnes).toBe(0);
    expect(Number.isFinite(tonnes)).toBe(true);
  });

  it('returns 0 for a zero or negative requirement', () => {
    const product = { nitrogenPct: 0, phosphorusPct: 20, potassiumPct: 0 };
    expect(nutrientRequirementToProductTonnes(NutrientCategory.PHOSPHORUS, 0, product)).toBe(0);
    expect(nutrientRequirementToProductTonnes(NutrientCategory.PHOSPHORUS, -5, product)).toBe(0);
  });
});
