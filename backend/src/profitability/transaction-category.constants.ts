export enum TransactionCategory {
  // Income
  LIVESTOCK_SALES = 'livestock_sales',
  MILK = 'milk',
  CROPS = 'crops',
  CONTRACTING_INCOME = 'contracting_income',
  SUBSIDIES = 'subsidies',
  OTHER_INCOME = 'other_income',
  // Variable costs
  FERTILISER = 'fertiliser',
  FEED = 'feed',
  VETERINARY = 'veterinary',
  SEED = 'seed',
  SPRAYS = 'sprays',
  CONTRACTING_COST = 'contracting_cost',
  FUEL = 'fuel',
  BEDDING = 'bedding',
  TRANSPORT = 'transport',
  OTHER_VARIABLE = 'other_variable',
  // Fixed costs
  MACHINERY = 'machinery',
  DEPRECIATION = 'depreciation',
  INSURANCE = 'insurance',
  ELECTRICITY = 'electricity',
  FINANCE = 'finance',
  BUILDINGS = 'buildings',
  LABOUR = 'labour',
  PROFESSIONAL_FEES = 'professional_fees',
  OTHER_FIXED = 'other_fixed',
}

export enum TransactionKind {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum CostType {
  VARIABLE = 'variable',
  FIXED = 'fixed',
}

export interface CategoryMeta {
  kind: TransactionKind;
  costType?: CostType;
  label: string;
}

/**
 * Single source of truth for what a category means — every aggregation in
 * this module reads through this map rather than re-deriving kind/costType
 * from a category's name or spelling.
 */
export const CATEGORY_META: Record<TransactionCategory, CategoryMeta> = {
  [TransactionCategory.LIVESTOCK_SALES]: { kind: TransactionKind.INCOME, label: 'Livestock sales' },
  [TransactionCategory.MILK]: { kind: TransactionKind.INCOME, label: 'Milk' },
  [TransactionCategory.CROPS]: { kind: TransactionKind.INCOME, label: 'Crops' },
  [TransactionCategory.CONTRACTING_INCOME]: {
    kind: TransactionKind.INCOME,
    label: 'Contracting income',
  },
  [TransactionCategory.SUBSIDIES]: { kind: TransactionKind.INCOME, label: 'Subsidies & payments' },
  [TransactionCategory.OTHER_INCOME]: { kind: TransactionKind.INCOME, label: 'Other income' },

  [TransactionCategory.FERTILISER]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Fertiliser',
  },
  [TransactionCategory.FEED]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Feed',
  },
  [TransactionCategory.VETERINARY]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Veterinary',
  },
  [TransactionCategory.SEED]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Seed',
  },
  [TransactionCategory.SPRAYS]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Sprays',
  },
  [TransactionCategory.CONTRACTING_COST]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Contracting',
  },
  [TransactionCategory.FUEL]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Fuel',
  },
  [TransactionCategory.BEDDING]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Bedding',
  },
  [TransactionCategory.TRANSPORT]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Transport',
  },
  [TransactionCategory.OTHER_VARIABLE]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.VARIABLE,
    label: 'Other variable cost',
  },

  [TransactionCategory.MACHINERY]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Machinery',
  },
  [TransactionCategory.DEPRECIATION]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Depreciation',
  },
  [TransactionCategory.INSURANCE]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Insurance',
  },
  [TransactionCategory.ELECTRICITY]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Electricity',
  },
  [TransactionCategory.FINANCE]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Finance',
  },
  [TransactionCategory.BUILDINGS]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Buildings',
  },
  [TransactionCategory.LABOUR]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Labour',
  },
  [TransactionCategory.PROFESSIONAL_FEES]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Professional fees',
  },
  [TransactionCategory.OTHER_FIXED]: {
    kind: TransactionKind.EXPENSE,
    costType: CostType.FIXED,
    label: 'Other fixed cost',
  },
};
