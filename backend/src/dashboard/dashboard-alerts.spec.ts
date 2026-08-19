import {
  buildGroupBuyAlert,
  buildHousingAlert,
  buildSoilAlert,
  buildWeightAlert,
  sortAlerts,
} from './dashboard-alerts';

describe('buildHousingAlert', () => {
  it('matches the Home Dashboard mockup: 7 cattle above capacity, 71 vs 64', () => {
    const alert = buildHousingAlert({
      shortfallHead: 7,
      projectedWinterStockHead: 71,
      totalCapacityHead: 64,
    });
    expect(alert).toEqual({
      severity: 'red',
      category: 'housing',
      title: '7 cattle above winter housing capacity',
      detail: '71 head projected vs 64 space capacity',
    });
  });

  it('returns null when capacity covers projected stock', () => {
    expect(
      buildHousingAlert({ shortfallHead: 0, projectedWinterStockHead: 50, totalCapacityHead: 64 }),
    ).toBeNull();
  });
});

describe('buildSoilAlert', () => {
  it('surfaces the field name and the first recommendation\'s "whatsWrong" text', () => {
    const alert = buildSoilAlert('Field 07', {
      recommendations: [
        { whatsWrong: 'Soil pH is 5.8 — below the 6.3 target for grazing.' },
        { whatsWrong: 'Soil phosphorus is at Index 2 — below the target Index 3.' },
      ],
    });
    expect(alert).toEqual({
      severity: 'amber',
      category: 'soil',
      title: 'Field 07 requires attention',
      detail: 'Soil pH is 5.8 — below the 6.3 target for grazing.',
    });
  });

  it('returns null for a field with no outstanding recommendations', () => {
    expect(buildSoilAlert('Field 01', { recommendations: [] })).toBeNull();
  });
});

describe('buildGroupBuyAlert', () => {
  it('matches the mockup: Protected Urea, estimated saving €640', () => {
    const alert = buildGroupBuyAlert('Protected Urea', {
      alreadyJoined: false,
      isExpired: false,
      personalized: { estimatedSavingEur: 640 },
    });
    expect(alert).toEqual({
      severity: 'green',
      category: 'group_buy',
      title: 'Protected Urea group purchase available',
      detail: 'Estimated saving €640',
    });
  });

  it('returns null once the farm has already joined', () => {
    expect(
      buildGroupBuyAlert('Protected Urea', {
        alreadyJoined: true,
        isExpired: false,
        personalized: { estimatedSavingEur: 640 },
      }),
    ).toBeNull();
  });

  it('returns null for an expired offer', () => {
    expect(
      buildGroupBuyAlert('Protected Urea', {
        alreadyJoined: false,
        isExpired: true,
        personalized: { estimatedSavingEur: 640 },
      }),
    ).toBeNull();
  });

  it('returns null when there is no requirement to personalize against, or no real saving', () => {
    expect(
      buildGroupBuyAlert('Protected Urea', {
        alreadyJoined: false,
        isExpired: false,
        personalized: null,
      }),
    ).toBeNull();
    expect(
      buildGroupBuyAlert('Protected Urea', {
        alreadyJoined: false,
        isExpired: false,
        personalized: { estimatedSavingEur: 0 },
      }),
    ).toBeNull();
  });
});

describe('buildWeightAlert', () => {
  it('matches the mockup: 8 cattle averaging 615kg', () => {
    const weights = [610, 612, 615, 617, 614, 618, 613, 621];
    const alert = buildWeightAlert(weights);
    expect(alert).toEqual({
      severity: 'amber',
      category: 'weight',
      title: '8 cattle near target weight',
      detail: 'Averaging 615kg — review selling window',
    });
  });

  it('returns null with no animals near target', () => {
    expect(buildWeightAlert([])).toBeNull();
  });
});

describe('sortAlerts', () => {
  it('orders red before amber before green', () => {
    const green = buildGroupBuyAlert('X', {
      alreadyJoined: false,
      isExpired: false,
      personalized: { estimatedSavingEur: 10 },
    })!;
    const amber = buildSoilAlert('Field 01', { recommendations: [{ whatsWrong: 'x' }] })!;
    const red = buildHousingAlert({
      shortfallHead: 1,
      projectedWinterStockHead: 65,
      totalCapacityHead: 64,
    })!;

    expect(sortAlerts([green, amber, red])).toEqual([red, amber, green]);
  });
});
