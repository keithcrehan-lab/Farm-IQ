import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Animal } from './animal.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { FarmsService } from '../farms/farms.service';
import { SPECIES_BY_CATEGORY } from '../livestock/livestock-group.entity';

@Injectable()
export class AnimalsService {
  constructor(
    @InjectRepository(Animal)
    private readonly animalsRepository: Repository<Animal>,
    private readonly farmsService: FarmsService,
  ) {}

  async create(farmId: string, ownerId: string, dto: CreateAnimalDto): Promise<Animal> {
    await this.farmsService.findOneOwned(farmId, ownerId);

    const existing = await this.animalsRepository.findOne({
      where: { farmId, tagNumber: dto.tagNumber },
    });
    if (existing) {
      throw new ConflictException(`Tag number ${dto.tagNumber} is already registered on this farm`);
    }

    const animal = this.animalsRepository.create({
      ...dto,
      farmId,
      species: SPECIES_BY_CATEGORY[dto.category],
      breed: dto.breed ?? null,
      dateOfBirth: dto.dateOfBirth ?? null,
      damTagNumber: dto.damTagNumber ?? null,
      sireTagNumber: dto.sireTagNumber ?? null,
      purchaseDate: dto.purchaseDate ?? null,
      purchasePriceEur: dto.purchasePriceEur ?? null,
      targetWeightKg: dto.targetWeightKg ?? null,
    });
    return this.animalsRepository.save(animal);
  }

  async findAllForFarm(farmId: string, ownerId: string): Promise<Animal[]> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    return this.animalsRepository.find({ where: { farmId }, order: { tagNumber: 'ASC' } });
  }

  /** Ownership-unchecked — for internal callers (e.g. DashboardService) that already hold an owned Farm. */
  findAllForFarmUnchecked(farmId: string): Promise<Animal[]> {
    return this.animalsRepository.find({ where: { farmId } });
  }

  async findOneOwned(farmId: string, animalId: string, ownerId: string): Promise<Animal> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const animal = await this.animalsRepository.findOne({ where: { id: animalId, farmId } });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    return animal;
  }

  async update(
    farmId: string,
    animalId: string,
    ownerId: string,
    dto: UpdateAnimalDto,
  ): Promise<Animal> {
    const animal = await this.findOneOwned(farmId, animalId, ownerId);

    if (dto.tagNumber && dto.tagNumber !== animal.tagNumber) {
      const existing = await this.animalsRepository.findOne({
        where: { farmId, tagNumber: dto.tagNumber },
      });
      if (existing) {
        throw new ConflictException(
          `Tag number ${dto.tagNumber} is already registered on this farm`,
        );
      }
    }

    Object.assign(animal, dto);
    if (dto.category) {
      animal.species = SPECIES_BY_CATEGORY[dto.category];
    }
    return this.animalsRepository.save(animal);
  }

  async remove(farmId: string, animalId: string, ownerId: string): Promise<void> {
    const animal = await this.findOneOwned(farmId, animalId, ownerId);
    await this.animalsRepository.remove(animal);
  }
}
