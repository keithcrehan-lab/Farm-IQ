export type AlertSeverity = 'red' | 'amber' | 'green';
export type AlertCategory = 'housing' | 'soil' | 'group_buy' | 'weight';

export interface DashboardAlert {
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  detail: string;
}

/**
 * Deterministic alert generation over data this API already computes — no
 * new agronomic or financial logic lives here, only the decision of when a
 * number that's already known is worth surfacing on the "needs your
 * attention" feed (product spec section 30).
 *
 * Deliberately does NOT cover the mockup's calving alert ("cows due to
 * calve") — that needs breeding/service dates, which is a separate future
 * module (spec section 16), not built. The near-target-weight alert below
 * only fires for animals with a farmer-set target — no threshold is ever
 * inferred.
 */

const SEVERITY_RANK: Record<AlertSeverity, number> = { red: 0, amber: 1, green: 2 };

export function sortAlerts(alerts: DashboardAlert[]): DashboardAlert[] {
  return [...alerts].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export interface HousingAlertInput {
  shortfallHead: number;
  projectedWinterStockHead: number;
  totalCapacityHead: number;
}

export function buildHousingAlert(housing: HousingAlertInput): DashboardAlert | null {
  if (housing.shortfallHead <= 0) return null;
  return {
    severity: 'red',
    category: 'housing',
    title: `${housing.shortfallHead} cattle above winter housing capacity`,
    detail: `${housing.projectedWinterStockHead} head projected vs ${housing.totalCapacityHead} space capacity`,
  };
}

export interface SoilAlertInput {
  recommendations: { whatsWrong: string }[];
}

export function buildSoilAlert(fieldName: string, analysis: SoilAlertInput): DashboardAlert | null {
  if (analysis.recommendations.length === 0) return null;
  return {
    severity: 'amber',
    category: 'soil',
    title: `${fieldName} requires attention`,
    detail: analysis.recommendations[0].whatsWrong,
  };
}

export interface GroupBuyAlertInput {
  alreadyJoined: boolean;
  isExpired: boolean;
  personalized: { estimatedSavingEur: number } | null;
}

export function buildGroupBuyAlert(
  productName: string,
  view: GroupBuyAlertInput,
): DashboardAlert | null {
  if (view.alreadyJoined || view.isExpired) return null;
  if (!view.personalized || view.personalized.estimatedSavingEur <= 0) return null;
  return {
    severity: 'green',
    category: 'group_buy',
    title: `${productName} group purchase available`,
    detail: `Estimated saving €${view.personalized.estimatedSavingEur}`,
  };
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** One alert aggregating every active animal that's reached its farmer-set near-target threshold. */
export function buildWeightAlert(nearTargetWeightsKg: number[]): DashboardAlert | null {
  if (nearTargetWeightsKg.length === 0) return null;
  const averageKg = round(
    nearTargetWeightsKg.reduce((sum, kg) => sum + kg, 0) / nearTargetWeightsKg.length,
  );
  return {
    severity: 'amber',
    category: 'weight',
    title: `${nearTargetWeightsKg.length} cattle near target weight`,
    detail: `Averaging ${averageKg}kg — review selling window`,
  };
}
