import { Injectable } from '@nestjs/common';
import { FarmsService } from '../farms/farms.service';
import { FieldsService } from '../fields/fields.service';
import { SoilTestsService } from '../soil-tests/soil-tests.service';
import { SoilIntelligenceService } from '../soil-tests/soil-intelligence.service';
import { FertiliserPlanService } from '../fertiliser-plan/fertiliser-plan.service';
import { HousingService } from '../livestock/housing.service';
import { ProfitabilityService } from '../profitability/profitability.service';
import { GroupBuyOffersService } from '../group-buy/group-buy-offers.service';
import { FarmSnapshot, FieldSummary } from './farm-snapshot';

@Injectable()
export class AssistantContextService {
  constructor(
    private readonly farmsService: FarmsService,
    private readonly fieldsService: FieldsService,
    private readonly soilTestsService: SoilTestsService,
    private readonly soilIntelligenceService: SoilIntelligenceService,
    private readonly fertiliserPlanService: FertiliserPlanService,
    private readonly housingService: HousingService,
    private readonly profitabilityService: ProfitabilityService,
    private readonly groupBuyOffersService: GroupBuyOffersService,
  ) {}

  async build(farmId: string, ownerId: string): Promise<FarmSnapshot> {
    const farm = await this.farmsService.findOneOwned(farmId, ownerId);
    const fields = await this.fieldsService.findAllForFarm(farmId, ownerId);

    const fieldSummaries: FieldSummary[] = await Promise.all(
      fields.map(async (field): Promise<FieldSummary> => {
        const latestTest = await this.soilTestsService.findLatestForFieldUnchecked(field.id);
        if (!latestTest) {
          return {
            name: field.name,
            areaHa: Number(field.areaHa),
            landUse: field.landUse,
            latestSoilTest: null,
            soilAnalysis: null,
          };
        }
        const soilAnalysis = this.soilIntelligenceService.analyze({
          areaHa: Number(field.areaHa),
          landUse: field.landUse,
          ph: Number(latestTest.ph),
          pIndex: latestTest.pIndex,
          kIndex: latestTest.kIndex,
        });
        return {
          name: field.name,
          areaHa: Number(field.areaHa),
          landUse: field.landUse,
          latestSoilTest: {
            sampleDate: latestTest.sampleDate,
            ph: Number(latestTest.ph),
            pIndex: latestTest.pIndex,
            kIndex: latestTest.kIndex,
          },
          soilAnalysis,
        };
      }),
    );

    const [fertiliserPlan, housing, profitability, allOffers] = await Promise.all([
      this.fertiliserPlanService.generateForFarm(farmId, ownerId),
      this.housingService.getSummary(farmId, ownerId),
      this.profitabilityService.getSummary(farmId, ownerId, new Date().getFullYear()),
      this.groupBuyOffersService.findAll({}),
    ]);

    // Relevant = this farm's county, or a nationwide offer (county null) — done
    // here rather than in GroupBuyOffersService so that service's own filter
    // semantics (exact-match only) stay simple and unchanged for its own API.
    const nearbyGroupBuyOffers = allOffers
      .filter((offer) => offer.county === null || offer.county === farm.county)
      .map((offer) => ({
        productName: offer.productName,
        county: offer.county,
        typicalPricePerTonneEur: Number(offer.typicalPricePerTonneEur),
        negotiatedPricePerTonneEur: Number(offer.negotiatedPricePerTonneEur),
        expiresAt: offer.expiresAt.toISOString(),
      }));

    return {
      farm: { name: farm.name, county: farm.county, farmType: farm.farmType },
      fields: fieldSummaries,
      fertiliserPlan,
      housing,
      profitability,
      nearbyGroupBuyOffers,
    };
  }
}
