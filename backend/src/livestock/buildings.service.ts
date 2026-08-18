import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingsRepository: Repository<Building>,
    private readonly farmsService: FarmsService,
  ) {}

  async create(farmId: string, ownerId: string, dto: CreateBuildingDto): Promise<Building> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const building = this.buildingsRepository.create({ ...dto, farmId });
    return this.buildingsRepository.save(building);
  }

  async findAllForFarm(farmId: string, ownerId: string): Promise<Building[]> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    return this.buildingsRepository.find({ where: { farmId }, order: { name: 'ASC' } });
  }

  /** Ownership-unchecked — for internal callers (e.g. HousingService) that already hold an owned Farm. */
  findAllForFarmUnchecked(farmId: string): Promise<Building[]> {
    return this.buildingsRepository.find({ where: { farmId } });
  }

  async findOneOwned(farmId: string, buildingId: string, ownerId: string): Promise<Building> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const building = await this.buildingsRepository.findOne({
      where: { id: buildingId, farmId },
    });
    if (!building) {
      throw new NotFoundException('Building not found');
    }
    return building;
  }

  async update(
    farmId: string,
    buildingId: string,
    ownerId: string,
    dto: UpdateBuildingDto,
  ): Promise<Building> {
    const building = await this.findOneOwned(farmId, buildingId, ownerId);
    Object.assign(building, dto);
    return this.buildingsRepository.save(building);
  }

  async remove(farmId: string, buildingId: string, ownerId: string): Promise<void> {
    const building = await this.findOneOwned(farmId, buildingId, ownerId);
    await this.buildingsRepository.remove(building);
  }
}
