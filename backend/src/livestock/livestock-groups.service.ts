import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LivestockGroup, SPECIES_BY_CATEGORY } from './livestock-group.entity';
import { UpsertLivestockGroupDto } from './dto/upsert-livestock-group.dto';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class LivestockGroupsService {
  constructor(
    @InjectRepository(LivestockGroup)
    private readonly livestockGroupsRepository: Repository<LivestockGroup>,
    private readonly farmsService: FarmsService,
  ) {}

  /**
   * A farm has at most one row per category, so recording a headcount is an
   * upsert keyed on (farmId, category) rather than a plain create — the
   * farmer re-enters "20 cows" and it replaces the old count, it doesn't add
   * a second "cow" row.
   */
  async upsert(
    farmId: string,
    ownerId: string,
    dto: UpsertLivestockGroupDto,
  ): Promise<LivestockGroup> {
    await this.farmsService.findOneOwned(farmId, ownerId);

    const existing = await this.livestockGroupsRepository.findOne({
      where: { farmId, category: dto.category },
    });

    if (existing) {
      existing.headCount = dto.headCount;
      return this.livestockGroupsRepository.save(existing);
    }

    const group = this.livestockGroupsRepository.create({
      farmId,
      category: dto.category,
      species: SPECIES_BY_CATEGORY[dto.category],
      headCount: dto.headCount,
    });
    return this.livestockGroupsRepository.save(group);
  }

  async findAllForFarm(farmId: string, ownerId: string): Promise<LivestockGroup[]> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    return this.livestockGroupsRepository.find({ where: { farmId }, order: { category: 'ASC' } });
  }

  /** Ownership-unchecked — for internal callers (e.g. HousingService) that already hold an owned Farm. */
  findAllForFarmUnchecked(farmId: string): Promise<LivestockGroup[]> {
    return this.livestockGroupsRepository.find({ where: { farmId } });
  }

  async remove(farmId: string, groupId: string, ownerId: string): Promise<void> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const group = await this.livestockGroupsRepository.findOne({ where: { id: groupId, farmId } });
    if (!group) {
      throw new NotFoundException('Livestock group not found');
    }
    await this.livestockGroupsRepository.remove(group);
  }
}
