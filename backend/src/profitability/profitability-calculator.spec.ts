import { TransactionCategory } from './transaction-category.constants';
import {
  TransactionInput,
  buildProfitabilitySummary,
  computeEnterpriseBreakdown,
  computeFieldBreakdown,
  computeTotals,
} from './profitability-calculator';

const SUCKLER = 'suckler-id';
const SHEEP = 'sheep-id';
const TILLAGE = 'tillage-id';

/** The exact enterprise figures from spec section 24 — chosen because they're
 * internally consistent: revenues sum to the whole-farm revenue in section 23
 * (86,400 + 42,800 + 55,300 = 184,500) and margins sum to the whole-farm
 * margin (32,700 + 11,900 + 2,100 = 46,700). */
function mockupTransactions(): TransactionInput[] {
  return [
    {
      category: TransactionCategory.LIVESTOCK_SALES,
      amountEur: 86400,
      enterpriseId: SUCKLER,
      fieldId: null,
    },
    { category: TransactionCategory.FEED, amountEur: 53700, enterpriseId: SUCKLER, fieldId: null },

    {
      category: TransactionCategory.LIVESTOCK_SALES,
      amountEur: 42800,
      enterpriseId: SHEEP,
      fieldId: null,
    },
    { category: TransactionCategory.FEED, amountEur: 30900, enterpriseId: SHEEP, fieldId: null },

    { category: TransactionCategory.CROPS, amountEur: 55300, enterpriseId: TILLAGE, fieldId: null },
    { category: TransactionCategory.SEED, amountEur: 53200, enterpriseId: TILLAGE, fieldId: null },
  ];
}

describe('computeTotals', () => {
  it('matches the whole-farm figures from spec section 23: revenue 184,500 / costs 137,800 / margin 46,700', () => {
    const totals = computeTotals(mockupTransactions());
    expect(totals.revenueEur).toBe(184500);
    expect(totals.costsEur).toBe(137800);
    expect(totals.marginEur).toBe(46700);
  });
});

describe('computeEnterpriseBreakdown', () => {
  it('matches the per-enterprise figures from spec section 24', () => {
    const enterprises = [
      { id: SUCKLER, name: 'Suckler', type: 'suckler' },
      { id: SHEEP, name: 'Sheep', type: 'sheep' },
      { id: TILLAGE, name: 'Tillage', type: 'tillage' },
    ];
    const { entries, unassigned } = computeEnterpriseBreakdown(mockupTransactions(), enterprises);

    expect(unassigned).toBeNull();
    expect(entries).toHaveLength(3);

    const suckler = entries.find((e) => e.enterpriseId === SUCKLER)!;
    expect(suckler.revenueEur).toBe(86400);
    expect(suckler.costsEur).toBe(53700);
    expect(suckler.marginEur).toBe(32700);

    const sheep = entries.find((e) => e.enterpriseId === SHEEP)!;
    expect(sheep.marginEur).toBe(11900);

    const tillage = entries.find((e) => e.enterpriseId === TILLAGE)!;
    expect(tillage.marginEur).toBe(2100);
  });

  it('buckets transactions with no enterpriseId as unassigned rather than dropping them', () => {
    const { entries, unassigned } = computeEnterpriseBreakdown(
      [
        {
          category: TransactionCategory.OTHER_INCOME,
          amountEur: 500,
          enterpriseId: null,
          fieldId: null,
        },
      ],
      [],
    );
    expect(entries).toHaveLength(0);
    expect(unassigned).toEqual({
      revenueEur: 500,
      variableCostsEur: 0,
      fixedCostsEur: 0,
      costsEur: 0,
      marginEur: 500,
    });
  });
});

describe('computeFieldBreakdown', () => {
  it('matches the return-per-hectare figures from spec section 25', () => {
    const fields = [
      { id: 'f1', name: 'Field 01', areaHa: 1 },
      { id: 'f2', name: 'Field 02', areaHa: 1 },
      { id: 'f3', name: 'Field 03', areaHa: 1 },
      { id: 'f4', name: 'Field 04', areaHa: 1 },
      { id: 'f5', name: 'Field 05', areaHa: 3 }, // no transactions
    ];
    const transactions: TransactionInput[] = [
      { category: TransactionCategory.CROPS, amountEur: 1140, enterpriseId: null, fieldId: 'f1' },
      { category: TransactionCategory.CROPS, amountEur: 920, enterpriseId: null, fieldId: 'f2' },
      { category: TransactionCategory.CROPS, amountEur: 310, enterpriseId: null, fieldId: 'f3' },
      { category: TransactionCategory.SEED, amountEur: 85, enterpriseId: null, fieldId: 'f4' },
    ];

    const { entries, fieldsWithoutTransactions } = computeFieldBreakdown(transactions, fields);

    expect(entries.find((e) => e.fieldId === 'f1')!.marginPerHaEur).toBe(1140);
    expect(entries.find((e) => e.fieldId === 'f2')!.marginPerHaEur).toBe(920);
    expect(entries.find((e) => e.fieldId === 'f3')!.marginPerHaEur).toBe(310);
    expect(entries.find((e) => e.fieldId === 'f4')!.marginPerHaEur).toBe(-85);

    expect(fieldsWithoutTransactions).toEqual([{ fieldId: 'f5', fieldName: 'Field 05' }]);
  });
});

describe('buildProfitabilitySummary', () => {
  it('reports hasData: false and a margin delta equal to this year when there is no prior-year data', () => {
    const summary = buildProfitabilitySummary(2026, mockupTransactions(), [], [], []);
    expect(summary.previousYear.hasData).toBe(false);
    expect(summary.previousYear.totals.marginEur).toBe(0);
    expect(summary.marginDeltaEur).toBe(46700);
  });

  it('computes real year-over-year margin contributors from category deltas, matching spec section 23', () => {
    // 2025: same shape, but €4,100 more fertiliser spend and €3,300 less livestock income
    // than 2026 — so 2026 should show lower fertiliser cost and higher livestock sales as
    // the top contributors, totalling the 7,400 improvement from spec section 23.
    const currentYear: TransactionInput[] = [
      {
        category: TransactionCategory.LIVESTOCK_SALES,
        amountEur: 90000,
        enterpriseId: null,
        fieldId: null,
      },
      {
        category: TransactionCategory.FERTILISER,
        amountEur: 10000,
        enterpriseId: null,
        fieldId: null,
      },
    ];
    const previousYear: TransactionInput[] = [
      {
        category: TransactionCategory.LIVESTOCK_SALES,
        amountEur: 86700,
        enterpriseId: null,
        fieldId: null,
      },
      {
        category: TransactionCategory.FERTILISER,
        amountEur: 14100,
        enterpriseId: null,
        fieldId: null,
      },
    ];

    const summary = buildProfitabilitySummary(2026, currentYear, previousYear, [], []);

    expect(summary.previousYear.hasData).toBe(true);
    expect(summary.marginDeltaEur).toBe(7400);

    const fertiliser = summary.topMarginContributors.find(
      (c) => c.category === TransactionCategory.FERTILISER,
    )!;
    expect(fertiliser.deltaEur).toBe(4100); // spending 4,100 less is a +4,100 margin contribution

    const sales = summary.topMarginContributors.find(
      (c) => c.category === TransactionCategory.LIVESTOCK_SALES,
    )!;
    expect(sales.deltaEur).toBe(3300);
  });
});
