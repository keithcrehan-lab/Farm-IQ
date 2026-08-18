import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from './farm.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmsRepository: Repository<Farm>,
  ) {}

  create(ownerId: string, dto: CreateFarmDto): Promise<Farm> {
    const farm = this.farmsRepository.create({ ...dto, ownerId });
    return this.farmsRepository.save(farm);
  }

  findAllForOwner(ownerId: string): Promise<Farm[]> {
    return this.farmsRepository.find({ where: { ownerId }, order: { createdAt: 'ASC' } });
  }

  /**
   * Loads a farm and asserts it belongs to `ownerId`. Every other module that
   * scopes work by farm (fields, soil tests, ...) should route through this so
   * ownership is enforced in exactly one place.
   */
  async findOneOwned(id: string, ownerId: string): Promise<Farm> {
    const farm = await this.farmsRepository.findOne({ where: { id } });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    if (farm.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this farm');
    }
    return farm;
  }

  async update(id: string, ownerId: string, dto: UpdateFarmDto): Promise<Farm> {
    const farm = await this.findOneOwned(id, ownerId);
    Object.assign(farm, dto);
    return this.farmsRepository.save(farm);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const farm = await this.findOneOwned(id, ownerId);
    await this.farmsRepository.remove(farm);
  }
}
