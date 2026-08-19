import { apiClient } from './client';

export type FarmType = 'suckler' | 'dairy' | 'sheep' | 'tillage' | 'mixed' | 'other';

export interface Farm {
  id: string;
  name: string;
  county: string | null;
  herdNumber: string | null;
  farmType: FarmType;
  createdAt: string;
  updatedAt: string;
}

export function listFarms() {
  return apiClient.get<Farm[]>('/farms').then((r) => r.data);
}

export function createFarm(input: { name: string; county?: string; farmType?: FarmType }) {
  return apiClient.post<Farm>('/farms', input).then((r) => r.data);
}
