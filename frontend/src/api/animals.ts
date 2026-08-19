import { apiClient } from './client';
import type { LivestockCategory, Species } from './livestock';

export type AnimalSex = 'male' | 'female';
export type AnimalStatus = 'active' | 'sold' | 'died';

export interface Animal {
  id: string;
  farmId: string;
  tagNumber: string;
  species: Species;
  category: LivestockCategory;
  breed: string | null;
  sex: AnimalSex;
  dateOfBirth: string | null;
  damTagNumber: string | null;
  sireTagNumber: string | null;
  purchaseDate: string | null;
  purchasePriceEur: number | null;
  targetWeightKg: number | null;
  status: AnimalStatus;
  saleDate: string | null;
  saleWeightKg: number | null;
  salePriceEur: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnimalWeight {
  id: string;
  animalId: string;
  weighDate: string;
  weightKg: number;
  createdAt: string;
}

export interface WeightAnalysis {
  latestWeightKg: number | null;
  latestWeighDate: string | null;
  averageDailyGainKgPerDay: number | null;
  targetWeightKg: number | null;
  progressPct: number | null;
  isNearTarget: boolean;
  estimatedDaysToTarget: number | null;
  projectedWeightIn30DaysKg: number | null;
}

export interface CreateAnimalInput {
  tagNumber: string;
  category: LivestockCategory;
  sex: AnimalSex;
  breed?: string;
  dateOfBirth?: string;
  targetWeightKg?: number;
}

/** `numeric` columns (purchasePriceEur, targetWeightKg, saleWeightKg, salePriceEur) come back as strings on raw reads. */
function normalizeAnimal(animal: Animal): Animal {
  return {
    ...animal,
    purchasePriceEur: animal.purchasePriceEur !== null ? Number(animal.purchasePriceEur) : null,
    targetWeightKg: animal.targetWeightKg !== null ? Number(animal.targetWeightKg) : null,
    saleWeightKg: animal.saleWeightKg !== null ? Number(animal.saleWeightKg) : null,
    salePriceEur: animal.salePriceEur !== null ? Number(animal.salePriceEur) : null,
  };
}

/** `weightKg` is a `numeric` column — same string-over-the-wire caveat. */
function normalizeWeight(weight: AnimalWeight): AnimalWeight {
  return { ...weight, weightKg: Number(weight.weightKg) };
}

export function listAnimals(farmId: string) {
  return apiClient.get<Animal[]>(`/farms/${farmId}/animals`).then((r) => r.data.map(normalizeAnimal));
}

export function createAnimal(farmId: string, input: CreateAnimalInput) {
  return apiClient.post<Animal>(`/farms/${farmId}/animals`, input).then((r) => normalizeAnimal(r.data));
}

export function listWeights(farmId: string, animalId: string) {
  return apiClient
    .get<AnimalWeight[]>(`/farms/${farmId}/animals/${animalId}/weights`)
    .then((r) => r.data.map(normalizeWeight));
}

export function getWeightAnalysis(farmId: string, animalId: string) {
  return apiClient
    .get<WeightAnalysis>(`/farms/${farmId}/animals/${animalId}/weights/analysis`)
    .then((r) => r.data);
}

export function addWeight(farmId: string, animalId: string, weighDate: string, weightKg: number) {
  return apiClient
    .post<AnimalWeight>(`/farms/${farmId}/animals/${animalId}/weights`, { weighDate, weightKg })
    .then((r) => normalizeWeight(r.data));
}
