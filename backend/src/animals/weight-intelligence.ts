export interface WeighingInput {
  weighDate: string; // ISO date
  weightKg: number;
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function sortedByDate(history: WeighingInput[]): WeighingInput[] {
  return [...history].sort((a, b) => a.weighDate.localeCompare(b.weighDate));
}

/**
 * Average daily gain in kg/day between the first and most recent weighing —
 * spec section 18. Needs at least two weighings on different dates; returns
 * null rather than a divide-by-zero or a single-point guess otherwise.
 */
export function computeAverageDailyGainKg(history: WeighingInput[]): number | null {
  if (history.length < 2) return null;
  const sorted = sortedByDate(history);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = daysBetween(first.weighDate, last.weighDate);
  if (days <= 0) return null;
  return round((last.weightKg - first.weightKg) / days, 3);
}

/**
 * Projects weight forward from the most recent weighing at the computed ADG.
 * Returns null when ADG can't be computed, or when targetDate isn't after
 * the most recent weighing (projecting backward isn't a projection).
 */
export function projectWeightKg(history: WeighingInput[], targetDateIso: string): number | null {
  const adg = computeAverageDailyGainKg(history);
  if (adg === null) return null;
  const sorted = sortedByDate(history);
  const last = sorted[sorted.length - 1];
  const days = daysBetween(last.weighDate, targetDateIso);
  if (days <= 0) return null;
  return round(last.weightKg + adg * days, 1);
}

/** How close the most recent weighing is to a farmer-set target, as a percentage. */
export function computeWeightProgressPct(latestWeightKg: number, targetWeightKg: number): number {
  if (targetWeightKg <= 0) return 0;
  return round((latestWeightKg / targetWeightKg) * 100, 1);
}

/**
 * First-pass heuristic threshold for "near target weight" — documented here
 * rather than buried in a magic number, same spirit as the fertiliser
 * nutrient-target constants. Worth revisiting against real selling
 * behaviour before this drives anything beyond a dashboard nudge.
 */
export const NEAR_TARGET_WEIGHT_THRESHOLD_PCT = 90;

export function isNearTargetWeight(latestWeightKg: number, targetWeightKg: number): boolean {
  if (targetWeightKg <= 0) return false;
  return (
    computeWeightProgressPct(latestWeightKg, targetWeightKg) >= NEAR_TARGET_WEIGHT_THRESHOLD_PCT
  );
}

/**
 * Days until the animal reaches its target weight at the current ADG. Real
 * arithmetic over real numbers, not a guess — null whenever it can't be
 * computed honestly: no positive ADG, or the target's already reached.
 */
export function estimateDaysToTarget(
  adgKgPerDay: number | null,
  latestWeightKg: number,
  targetWeightKg: number,
): number | null {
  if (adgKgPerDay === null || adgKgPerDay <= 0) return null;
  if (latestWeightKg >= targetWeightKg) return null;
  return Math.ceil((targetWeightKg - latestWeightKg) / adgKgPerDay);
}
