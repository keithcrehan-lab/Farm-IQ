import { computeOfferProgress, isOfferExpired, personalizeOffer } from './group-buy-calculator';

describe('personalizeOffer', () => {
  it('matches the Group Buy Offer mockup exactly: 8t @ €560/t typical vs €480/t negotiated = €640 saving', () => {
    const result = personalizeOffer(
      { typicalPricePerTonneEur: 560, negotiatedPricePerTonneEur: 480 },
      8,
    );

    expect(result.savingPerTonneEur).toBe(80);
    expect(result.typicalCostEur).toBe(4480);
    expect(result.negotiatedCostEur).toBe(3840);
    expect(result.estimatedSavingEur).toBe(640);
  });

  it('scales linearly with requirement', () => {
    const result = personalizeOffer(
      { typicalPricePerTonneEur: 500, negotiatedPricePerTonneEur: 465 },
      10,
    );
    expect(result.savingPerTonneEur).toBe(35);
    expect(result.estimatedSavingEur).toBe(350);
  });
});

describe('computeOfferProgress', () => {
  it('matches the mockup: 126t committed against a 150t threshold, not yet met', () => {
    // 17 farms summing to 126t combined demand, as in the mockup card.
    const quantities = Array(17).fill(126 / 17);
    const progress = computeOfferProgress(quantities, 150);

    expect(progress.totalCommittedTonnes).toBe(126);
    expect(progress.participantCount).toBe(17);
    expect(progress.progressPct).toBe(84);
    expect(progress.thresholdMet).toBe(false);
  });

  it('reports thresholdMet once commitments reach the threshold', () => {
    const progress = computeOfferProgress([80, 70], 150);
    expect(progress.totalCommittedTonnes).toBe(150);
    expect(progress.thresholdMet).toBe(true);
  });

  it('handles zero participants without dividing by zero oddly', () => {
    const progress = computeOfferProgress([], 150);
    expect(progress.totalCommittedTonnes).toBe(0);
    expect(progress.participantCount).toBe(0);
    expect(progress.progressPct).toBe(0);
    expect(progress.thresholdMet).toBe(false);
  });
});

describe('isOfferExpired', () => {
  it('is true once the expiry instant has passed', () => {
    const now = new Date('2026-08-20T12:00:00Z');
    expect(isOfferExpired(new Date('2026-08-19T00:00:00Z'), now)).toBe(true);
    expect(isOfferExpired(new Date('2026-08-21T00:00:00Z'), now)).toBe(false);
  });
});
