import { apiClient } from './client';

export type SoilType = 'mineral' | 'peat' | 'gley' | 'unknown';
export type LandUse = 'grazing' | 'silage' | 'tillage' | 'rough_grazing' | 'other';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  boundary: GeoJsonPolygon;
  areaHa: number;
  soilType: SoilType;
  landUse: LandUse;
  createdAt: string;
  updatedAt: string;
}

/** `areaHa` is a `numeric` column — TypeORM/node-postgres return it as a string on raw reads. */
function normalizeField(field: Field): Field {
  return { ...field, areaHa: Number(field.areaHa) };
}

export function listFields(farmId: string) {
  return apiClient.get<Field[]>(`/farms/${farmId}/fields`).then((r) => r.data.map(normalizeField));
}

export function getField(farmId: string, fieldId: string) {
  return apiClient.get<Field>(`/farms/${farmId}/fields/${fieldId}`).then((r) => normalizeField(r.data));
}
