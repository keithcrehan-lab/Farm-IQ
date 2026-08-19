export type AlertSeverity = 'red' | 'amber' | 'green';
export type AlertCategory = 'housing' | 'soil' | 'group_buy';

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
 * Deliberately covers only housing, soil and group-buy: the mockup's other
 * alert types (cattle near target weight, cows due to calve) need per-animal
 * weight history and breeding dates, which this API doesn't track yet — see
 * spec section 15's individual animal records, not built. No alert here is
 * ever backed by a guess.
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
