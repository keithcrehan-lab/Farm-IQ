import {
  CATEGORY_META,
  CostType,
  TransactionCategory,
  TransactionKind,
} from './transaction-category.constants';

export interface TransactionInput {
  category: TransactionCategory;
  amountEur: number;
  enterpriseId: string | null;
  fieldId: string | null;
}

export interface EnterpriseInput {
  id: string;
  name: string;
  type: string;
}

export interface FieldInput {
  id: string;
  name: string;
  areaHa: number;
}

export interface Totals {
  revenueEur: number;
  variableCostsEur: number;
  fixedCostsEur: number;
  costsEur: number;
  marginEur: number;
}

export interface EnterpriseBreakdownEntry extends Totals {
  enterpriseId: string;
  name: string;
  type: string;
}

export interface FieldBreakdownEntry extends Totals {
  fieldId: string;
  name: string;
  areaHa: number;
  marginPerHaEur: number;
}

export interface CategoryContributor {
  category: TransactionCategory;
  label: string;
  /** Positive = helped margin (more revenue or less cost); negative = hurt margin. */
  deltaEur: number;
}

export interface ProfitabilitySummary {
  year: number;
  totals: Totals;
  previousYear: { year: number; totals: Totals; hasData: boolean };
  marginDeltaEur: number;
  topMarginContributors: CategoryContributor[];
  enterprises: EnterpriseBreakdownEntry[];
  unassignedToEnterprise: Totals | null;
  fields: FieldBreakdownEntry[];
  fieldsWithoutTransactions: { fieldId: string; fieldName: string }[];
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function emptyTotals(): Totals {
  return { revenueEur: 0, variableCostsEur: 0, fixedCostsEur: 0, costsEur: 0, marginEur: 0 };
}

function addTransactionToTotals(totals: Totals, tx: TransactionInput): void {
  const meta = CATEGORY_META[tx.category];
  if (meta.kind === TransactionKind.INCOME) {
    totals.revenueEur += tx.amountEur;
  } else {
    totals.costsEur += tx.amountEur;
    if (meta.costType === CostType.FIXED) {
      totals.fixedCostsEur += tx.amountEur;
    } else {
      totals.variableCostsEur += tx.amountEur;
    }
  }
}

function finalizeTotals(totals: Totals): Totals {
  return {
    revenueEur: round(totals.revenueEur),
    variableCostsEur: round(totals.variableCostsEur),
    fixedCostsEur: round(totals.fixedCostsEur),
    costsEur: round(totals.costsEur),
    marginEur: round(totals.revenueEur - totals.costsEur),
  };
}

export function computeTotals(transactions: TransactionInput[]): Totals {
  const totals = emptyTotals();
  for (const tx of transactions) addTransactionToTotals(totals, tx);
  return finalizeTotals(totals);
}

/** Signed per-category sum: income positive, expense negative — summing every category gives the margin. */
function marginContributionByCategory(
  transactions: TransactionInput[],
): Map<TransactionCategory, number> {
  const map = new Map<TransactionCategory, number>();
  for (const tx of transactions) {
    const meta = CATEGORY_META[tx.category];
    const signed = meta.kind === TransactionKind.INCOME ? tx.amountEur : -tx.amountEur;
    map.set(tx.category, (map.get(tx.category) ?? 0) + signed);
  }
  return map;
}

function topMarginContributors(
  currentTx: TransactionInput[],
  previousTx: TransactionInput[],
  limit = 3,
): CategoryContributor[] {
  const current = marginContributionByCategory(currentTx);
  const previous = marginContributionByCategory(previousTx);
  const categories = new Set([...current.keys(), ...previous.keys()]);

  const contributors: CategoryContributor[] = [...categories].map((category) => ({
    category,
    label: CATEGORY_META[category].label,
    deltaEur: round((current.get(category) ?? 0) - (previous.get(category) ?? 0)),
  }));

  return contributors
    .filter((c) => c.deltaEur !== 0)
    .sort((a, b) => Math.abs(b.deltaEur) - Math.abs(a.deltaEur))
    .slice(0, limit);
}

export function computeEnterpriseBreakdown(
  transactions: TransactionInput[],
  enterprises: EnterpriseInput[],
): { entries: EnterpriseBreakdownEntry[]; unassigned: Totals | null } {
  const byEnterprise = new Map<string, Totals>();
  const unassigned = emptyTotals();
  let hasUnassigned = false;

  for (const tx of transactions) {
    if (!tx.enterpriseId) {
      addTransactionToTotals(unassigned, tx);
      hasUnassigned = true;
      continue;
    }
    if (!byEnterprise.has(tx.enterpriseId)) byEnterprise.set(tx.enterpriseId, emptyTotals());
    addTransactionToTotals(byEnterprise.get(tx.enterpriseId)!, tx);
  }

  const entries: EnterpriseBreakdownEntry[] = enterprises
    .filter((e) => byEnterprise.has(e.id))
    .map((e) => ({
      enterpriseId: e.id,
      name: e.name,
      type: e.type,
      ...finalizeTotals(byEnterprise.get(e.id)!),
    }));

  return { entries, unassigned: hasUnassigned ? finalizeTotals(unassigned) : null };
}

export function computeFieldBreakdown(
  transactions: TransactionInput[],
  fields: FieldInput[],
): {
  entries: FieldBreakdownEntry[];
  fieldsWithoutTransactions: { fieldId: string; fieldName: string }[];
} {
  const byField = new Map<string, Totals>();

  for (const tx of transactions) {
    if (!tx.fieldId) continue;
    if (!byField.has(tx.fieldId)) byField.set(tx.fieldId, emptyTotals());
    addTransactionToTotals(byField.get(tx.fieldId)!, tx);
  }

  const entries: FieldBreakdownEntry[] = [];
  const fieldsWithoutTransactions: { fieldId: string; fieldName: string }[] = [];

  for (const field of fields) {
    const totals = byField.get(field.id);
    if (!totals) {
      fieldsWithoutTransactions.push({ fieldId: field.id, fieldName: field.name });
      continue;
    }
    const finalized = finalizeTotals(totals);
    entries.push({
      fieldId: field.id,
      name: field.name,
      areaHa: field.areaHa,
      ...finalized,
      marginPerHaEur: field.areaHa > 0 ? round(finalized.marginEur / field.areaHa) : 0,
    });
  }

  return { entries, fieldsWithoutTransactions };
}

/**
 * Assembles the full profitability picture for one year, deterministically
 * from real transaction data. No fabricated deltas: `previousYear.hasData`
 * tells the caller whether a YoY comparison means anything yet, and
 * `topMarginContributors` is computed from real per-category deltas, never
 * a hand-written explanation string.
 */
export function buildProfitabilitySummary(
  year: number,
  currentYearTx: TransactionInput[],
  previousYearTx: TransactionInput[],
  enterprises: EnterpriseInput[],
  fields: FieldInput[],
): ProfitabilitySummary {
  const totals = computeTotals(currentYearTx);
  const previousTotals = computeTotals(previousYearTx);
  const { entries: enterpriseEntries, unassigned } = computeEnterpriseBreakdown(
    currentYearTx,
    enterprises,
  );
  const { entries: fieldEntries, fieldsWithoutTransactions } = computeFieldBreakdown(
    currentYearTx,
    fields,
  );

  return {
    year,
    totals,
    previousYear: { year: year - 1, totals: previousTotals, hasData: previousYearTx.length > 0 },
    marginDeltaEur: round(totals.marginEur - previousTotals.marginEur),
    topMarginContributors: topMarginContributors(currentYearTx, previousYearTx),
    enterprises: enterpriseEntries,
    unassignedToEnterprise: unassigned,
    fields: fieldEntries,
    fieldsWithoutTransactions,
  };
}
