import { Injectable } from '@nestjs/common';
import { FarmsService } from '../farms/farms.service';
import { BuildingsService } from './buildings.service';
import { LivestockGroupsService } from './livestock-groups.service';
import { HousingSummary, summarizeHousing } from './housing-intelligence';

@Injectable()
export class HousingService {
  constructor(
    private readonly farmsService: FarmsService,
    private readonly buildingsService: BuildingsService,
    private readonly livestockGroupsService: LivestockGroupsService,
  ) {}

  async getSummary(farmId: string, ownerId: string): Promise<HousingSummary> {
    await this.farmsService.findOneOwned(farmId, ownerId);

    const [buildings, groups] = await Promise.all([
      this.buildingsService.findAllForFarmUnchecked(farmId),
      this.livestockGroupsService.findAllForFarmUnchecked(farmId),
    ]);

    return summarizeHousing(buildings, groups);
  }
}
