import { apiClient } from './client';

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
  category: string;
  label: string;
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

export function getProfitability(farmId: string, year?: number) {
  return apiClient
    .get<ProfitabilitySummary>(`/farms/${farmId}/profitability`, { params: year ? { year } : {} })
    .then((r) => r.data);
}
