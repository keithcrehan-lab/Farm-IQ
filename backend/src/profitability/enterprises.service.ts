import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from './enterprise.entity';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class EnterprisesService {
  constructor(
    @InjectRepository(Enterprise)
    private readonly enterprisesRepository: Repository<Enterprise>,
    private readonly farmsService: FarmsService,
  ) {}

  async create(farmId: string, ownerId: string, dto: CreateEnterpriseDto): Promise<Enterprise> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const enterprise = this.enterprisesRepository.create({ ...dto, farmId });
    return this.enterprisesRepository.save(enterprise);
  }

  async findAllForFarm(farmId: string, ownerId: string): Promise<Enterprise[]> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    return this.enterprisesRepository.find({ where: { farmId }, order: { name: 'ASC' } });
  }

  /** Ownership-unchecked — for internal callers (e.g. ProfitabilityService) that already hold an owned Farm. */
  findAllForFarmUnchecked(farmId: string): Promise<Enterprise[]> {
    return this.enterprisesRepository.find({ where: { farmId } });
  }

  async findOneOwned(farmId: string, enterpriseId: string, ownerId: string): Promise<Enterprise> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const enterprise = await this.enterprisesRepository.findOne({
      where: { id: enterpriseId, farmId },
    });
    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }
    return enterprise;
  }

  async update(
    farmId: string,
    enterpriseId: string,
    ownerId: string,
    dto: UpdateEnterpriseDto,
  ): Promise<Enterprise> {
    const enterprise = await this.findOneOwned(farmId, enterpriseId, ownerId);
    Object.assign(enterprise, dto);
    return this.enterprisesRepository.save(enterprise);
  }

  async remove(farmId: string, enterpriseId: string, ownerId: string): Promise<void> {
    const enterprise = await this.findOneOwned(farmId, enterpriseId, ownerId);
    await this.enterprisesRepository.remove(enterprise);
  }
}
