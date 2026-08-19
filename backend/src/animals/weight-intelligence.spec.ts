import {
  computeAverageDailyGainKg,
  computeWeightProgressPct,
  estimateDaysToTarget,
  isNearTargetWeight,
  projectWeightKg,
} from './weight-intelligence';

// The exact weight-tracking scenario from the design mockups (spec section
// 18): 1 March 342kg -> 1 May 397kg -> 1 July 468kg.
const MOCKUP_HISTORY = [
  { weighDate: '2026-03-01', weightKg: 342 },
  { weighDate: '2026-05-01', weightKg: 397 },
  { weighDate: '2026-07-01', weightKg: 468 },
];

describe('computeAverageDailyGainKg', () => {
  it('computes ADG from the first to the most recent weighing, ignoring order given', () => {
    // 468 - 342 = 126kg over 122 days (1 Mar -> 1 Jul 2026) = ~1.033 kg/day
    const adg = computeAverageDailyGainKg(MOCKUP_HISTORY);
    expect(adg).toBeCloseTo(1.033, 2);

    // Order shouldn't matter — the function sorts internally.
    const shuffled = [MOCKUP_HISTORY[2], MOCKUP_HISTORY[0], MOCKUP_HISTORY[1]];
    expect(computeAverageDailyGainKg(shuffled)).toBe(adg);
  });

  it('returns null with fewer than two weighings', () => {
    expect(computeAverageDailyGainKg([])).toBeNull();
    expect(computeAverageDailyGainKg([MOCKUP_HISTORY[0]])).toBeNull();
  });

  it('returns null rather than dividing by zero when both weighings share a date', () => {
    expect(
      computeAverageDailyGainKg([
        { weighDate: '2026-03-01', weightKg: 340 },
        { weighDate: '2026-03-01', weightKg: 342 },
      ]),
    ).toBeNull();
  });
});

describe('projectWeightKg', () => {
  it('projects forward from the most recent weighing at the computed ADG', () => {
    // ADG ~1.033 kg/day; 30 days after 1 July -> ~468 + 31.0 = ~499
    const projected = projectWeightKg(MOCKUP_HISTORY, '2026-07-31');
    expect(projected).toBeCloseTo(499, 0);
  });

  it('returns null when the target date is not after the most recent weighing', () => {
    expect(projectWeightKg(MOCKUP_HISTORY, '2026-07-01')).toBeNull();
    expect(projectWeightKg(MOCKUP_HISTORY, '2026-06-01')).toBeNull();
  });

  it('returns null when ADG cannot be computed', () => {
    expect(projectWeightKg([MOCKUP_HISTORY[0]], '2026-12-01')).toBeNull();
  });
});

describe('computeWeightProgressPct and isNearTargetWeight', () => {
  it('matches the mockup: ~615kg average approaching a 650kg finishing target', () => {
    expect(computeWeightProgressPct(615, 650)).toBeCloseTo(94.6, 1);
    expect(isNearTargetWeight(615, 650)).toBe(true);
  });

  it('is not near target well below the threshold', () => {
    expect(isNearTargetWeight(468, 650)).toBe(false);
  });

  it('handles a missing/zero target without dividing by zero', () => {
    expect(computeWeightProgressPct(500, 0)).toBe(0);
    expect(isNearTargetWeight(500, 0)).toBe(false);
  });
});

describe('estimateDaysToTarget', () => {
  it('computes days needed at the given ADG', () => {
    // 650 - 468 = 182kg to go at ~1.033 kg/day -> ~177 days
    const adg = computeAverageDailyGainKg(MOCKUP_HISTORY)!;
    expect(estimateDaysToTarget(adg, 468, 650)).toBe(177);
  });

  it('returns null once the target is already reached', () => {
    expect(estimateDaysToTarget(1.0, 660, 650)).toBeNull();
  });

  it('returns null with no positive ADG', () => {
    expect(estimateDaysToTarget(null, 468, 650)).toBeNull();
    expect(estimateDaysToTarget(0, 468, 650)).toBeNull();
    expect(estimateDaysToTarget(-0.5, 468, 650)).toBeNull();
  });
});
