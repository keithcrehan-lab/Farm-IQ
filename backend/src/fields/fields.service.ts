import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as turf from '@turf/turf';
import { Field, GeoJsonPolygon } from './field.entity';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class FieldsService {
  constructor(
    @InjectRepository(Field)
    private readonly fieldsRepository: Repository<Field>,
    private readonly farmsService: FarmsService,
  ) {}

  /** Server-computed from the polygon — never trust an area a client sends. */
  computeAreaHa(boundary: GeoJsonPolygon): number {
    let squareMetres: number;
    try {
      squareMetres = turf.area(turf.polygon(boundary.coordinates));
    } catch {
      throw new BadRequestException('boundary is not a valid polygon');
    }
    if (!Number.isFinite(squareMetres) || squareMetres <= 0) {
      throw new BadRequestException('boundary must enclose a positive area');
    }
    return Math.round((squareMetres / 10_000) * 1000) / 1000;
  }

  async create(farmId: string, ownerId: string, dto: CreateFieldDto): Promise<Field> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const field = this.fieldsRepository.create({
      ...dto,
      farmId,
      areaHa: this.computeAreaHa(dto.boundary),
    });
    return this.fieldsRepository.save(field);
  }

  async findAllForFarm(farmId: string, ownerId: string): Promise<Field[]> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    return this.fieldsRepository.find({ where: { farmId }, order: { name: 'ASC' } });
  }

  async findOneOwned(farmId: string, fieldId: string, ownerId: string): Promise<Field> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const field = await this.fieldsRepository.findOne({ where: { id: fieldId, farmId } });
    if (!field) {
      throw new NotFoundException('Field not found');
    }
    return field;
  }

  async update(
    farmId: string,
    fieldId: string,
    ownerId: string,
    dto: UpdateFieldDto,
  ): Promise<Field> {
    const field = await this.findOneOwned(farmId, fieldId, ownerId);
    Object.assign(field, dto);
    if (dto.boundary) {
      field.areaHa = this.computeAreaHa(dto.boundary);
    }
    return this.fieldsRepository.save(field);
  }

  async remove(farmId: string, fieldId: string, ownerId: string): Promise<void> {
    const field = await this.findOneOwned(farmId, fieldId, ownerId);
    await this.fieldsRepository.remove(field);
  }
}
