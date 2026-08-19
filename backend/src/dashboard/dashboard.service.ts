import { Injectable } from '@nestjs/common';
import { FarmsService } from '../farms/farms.service';
import { FieldsService } from '../fields/fields.service';
import { SoilTestsService } from '../soil-tests/soil-tests.service';
import { SoilIntelligenceService } from '../soil-tests/soil-intelligence.service';
import { HousingService } from '../livestock/housing.service';
import { ProfitabilityService } from '../profitability/profitability.service';
import { GroupBuyOffersService } from '../group-buy/group-buy-offers.service';
import { GroupBuyParticipantsService } from '../group-buy/group-buy-participants.service';
import {
  DashboardAlert,
  buildGroupBuyAlert,
  buildHousingAlert,
  buildSoilAlert,
  sortAlerts,
} from './dashboard-alerts';

export interface Dashboard {
  farm: { name: string; county: string | null };
  projectedAnnualMarginEur: number;
  /** null when there's no prior-year data to compare against yet — never a fabricated zero. */
  marginDeltaEur: number | null;
  alerts: DashboardAlert[];
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly farmsService: FarmsService,
    private readonly fieldsService: FieldsService,
    private readonly soilTestsService: SoilTestsService,
    private readonly soilIntelligenceService: SoilIntelligenceService,
    private readonly housingService: HousingService,
    private readonly profitabilityService: ProfitabilityService,
    private readonly groupBuyOffersService: GroupBuyOffersService,
    private readonly groupBuyParticipantsService: GroupBuyParticipantsService,
  ) {}

  async getDashboard(farmId: string, ownerId: string): Promise<Dashboard> {
    const farm = await this.farmsService.findOneOwned(farmId, ownerId);

    const [fields, housing, profitability] = await Promise.all([
      this.fieldsService.findAllForFarm(farmId, ownerId),
      this.housingService.getSummary(farmId, ownerId),
      this.profitabilityService.getSummary(farmId, ownerId, new Date().getFullYear()),
    ]);

    const alerts: DashboardAlert[] = [];

    const housingAlert = buildHousingAlert(housing);
    if (housingAlert) alerts.push(housingAlert);

    for (const field of fields) {
      const latestTest = await this.soilTestsService.findLatestForFieldUnchecked(field.id);
      if (!latestTest) continue;
      const analysis = this.soilIntelligenceService.analyze({
        areaHa: Number(field.areaHa),
        landUse: field.landUse,
        ph: Number(latestTest.ph),
        pIndex: latestTest.pIndex,
        kIndex: latestTest.kIndex,
      });
      const soilAlert = buildSoilAlert(field.name, analysis);
      if (soilAlert) alerts.push(soilAlert);
    }

    const activeOffers = await this.groupBuyOffersService.findAll({});
    const relevantOffers = activeOffers.filter(
      (offer) => offer.county === null || offer.county === farm.county,
    );
    for (const offer of relevantOffers) {
      const view = await this.groupBuyParticipantsService.getFarmView(offer.id, farmId, ownerId);
      const offerAlert = buildGroupBuyAlert(offer.productName, view);
      if (offerAlert) alerts.push(offerAlert);
    }

    return {
      farm: { name: farm.name, county: farm.county },
      projectedAnnualMarginEur: profitability.totals.marginEur,
      marginDeltaEur: profitability.previousYear.hasData ? profitability.marginDeltaEur : null,
      alerts: sortAlerts(alerts),
    };
  }
}
