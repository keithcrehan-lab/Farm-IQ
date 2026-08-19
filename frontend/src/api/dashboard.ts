import { apiClient } from './client';

export type AlertSeverity = 'red' | 'amber' | 'green';
export type AlertCategory = 'housing' | 'soil' | 'group_buy' | 'weight';

export interface DashboardAlert {
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  detail: string;
}

export interface Dashboard {
  farm: { name: string; county: string | null };
  projectedAnnualMarginEur: number;
  marginDeltaEur: number | null;
  alerts: DashboardAlert[];
}

export function getDashboard(farmId: string) {
  return apiClient.get<Dashboard>(`/farms/${farmId}/dashboard`).then((r) => r.data);
}
