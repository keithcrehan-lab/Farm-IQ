import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoilTest } from './soil-test.entity';
import { CreateSoilTestDto } from './dto/create-soil-test.dto';
import { FieldsService } from '../fields/fields.service';
import { SoilIntelligenceService, SoilAnalysisResult } from './soil-intelligence.service';

@Injectable()
export class SoilTestsService {
  constructor(
    @InjectRepository(SoilTest)
    private readonly soilTestsRepository: Repository<SoilTest>,
    private readonly fieldsService: FieldsService,
    private readonly soilIntelligenceService: SoilIntelligenceService,
  ) {}

  async create(
    farmId: string,
    fieldId: string,
    ownerId: string,
    dto: CreateSoilTestDto,
  ): Promise<SoilTest> {
    await this.fieldsService.findOneOwned(farmId, fieldId, ownerId);
    const soilTest = this.soilTestsRepository.create({ ...dto, fieldId });
    return this.soilTestsRepository.save(soilTest);
  }

  async findAllForField(farmId: string, fieldId: string, ownerId: string): Promise<SoilTest[]> {
    await this.fieldsService.findOneOwned(farmId, fieldId, ownerId);
    return this.soilTestsRepository.find({
      where: { fieldId },
      order: { sampleDate: 'DESC' },
    });
  }

  async findOneOwned(
    farmId: string,
    fieldId: string,
    testId: string,
    ownerId: string,
  ): Promise<SoilTest> {
    await this.fieldsService.findOneOwned(farmId, fieldId, ownerId);
    const test = await this.soilTestsRepository.findOne({ where: { id: testId, fieldId } });
    if (!test) {
      throw new NotFoundException('Soil test not found');
    }
    return test;
  }

  /** Combines the latest test's readings with the field's area/land use into an analysis. */
  async analyze(
    farmId: string,
    fieldId: string,
    testId: string,
    ownerId: string,
  ): Promise<SoilAnalysisResult> {
    const field = await this.fieldsService.findOneOwned(farmId, fieldId, ownerId);
    const test = await this.findOneOwned(farmId, fieldId, testId, ownerId);
    return this.soilIntelligenceService.analyze({
      areaHa: Number(field.areaHa),
      landUse: field.landUse,
      ph: Number(test.ph),
      pIndex: test.pIndex,
      kIndex: test.kIndex,
    });
  }
}
