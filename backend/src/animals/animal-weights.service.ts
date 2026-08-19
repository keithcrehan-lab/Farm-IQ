import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimalWeight } from './animal-weight.entity';
import { CreateAnimalWeightDto } from './dto/create-animal-weight.dto';
import { AnimalsService } from './animals.service';
import {
  computeAverageDailyGainKg,
  computeWeightProgressPct,
  estimateDaysToTarget,
  isNearTargetWeight,
  projectWeightKg,
} from './weight-intelligence';

export interface WeightAnalysis {
  latestWeightKg: number | null;
  latestWeighDate: string | null;
  averageDailyGainKgPerDay: number | null;
  targetWeightKg: number | null;
  progressPct: number | null;
  isNearTarget: boolean;
  estimatedDaysToTarget: number | null;
  projectedWeightIn30DaysKg: number | null;
}

@Injectable()
export class AnimalWeightsService {
  constructor(
    @InjectRepository(AnimalWeight)
    private readonly weightsRepository: Repository<AnimalWeight>,
    private readonly animalsService: AnimalsService,
  ) {}

  async create(
    farmId: string,
    animalId: string,
    ownerId: string,
    dto: CreateAnimalWeightDto,
  ): Promise<AnimalWeight> {
    await this.animalsService.findOneOwned(farmId, animalId, ownerId);
    const weight = this.weightsRepository.create({ ...dto, animalId });
    return this.weightsRepository.save(weight);
  }

  async findAllForAnimal(
    farmId: string,
    animalId: string,
    ownerId: string,
  ): Promise<AnimalWeight[]> {
    await this.animalsService.findOneOwned(farmId, animalId, ownerId);
    return this.findAllForAnimalUnchecked(animalId);
  }

  /** Ownership-unchecked — for internal callers that already hold an owned Animal. */
  findAllForAnimalUnchecked(animalId: string): Promise<AnimalWeight[]> {
    return this.weightsRepository.find({ where: { animalId }, order: { weighDate: 'ASC' } });
  }

  async getAnalysis(farmId: string, animalId: string, ownerId: string): Promise<WeightAnalysis> {
    const animal = await this.animalsService.findOneOwned(farmId, animalId, ownerId);
    const history = await this.findAllForAnimalUnchecked(animalId);

    if (history.length === 0) {
      return {
        latestWeightKg: null,
        latestWeighDate: null,
        averageDailyGainKgPerDay: null,
        targetWeightKg: animal.targetWeightKg !== null ? Number(animal.targetWeightKg) : null,
        progressPct: null,
        isNearTarget: false,
        estimatedDaysToTarget: null,
        projectedWeightIn30DaysKg: null,
      };
    }

    const weighingInputs = history.map((w) => ({
      weighDate: w.weighDate,
      weightKg: Number(w.weightKg),
    }));
    const latest = weighingInputs[weighingInputs.length - 1];
    const adg = computeAverageDailyGainKg(weighingInputs);
    const targetWeightKg = animal.targetWeightKg !== null ? Number(animal.targetWeightKg) : null;

    const thirtyDaysOut = new Date(latest.weighDate);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    return {
      latestWeightKg: latest.weightKg,
      latestWeighDate: latest.weighDate,
      averageDailyGainKgPerDay: adg,
      targetWeightKg,
      progressPct: targetWeightKg
        ? computeWeightProgressPct(latest.weightKg, targetWeightKg)
        : null,
      isNearTarget: targetWeightKg ? isNearTargetWeight(latest.weightKg, targetWeightKg) : false,
      estimatedDaysToTarget: targetWeightKg
        ? estimateDaysToTarget(adg, latest.weightKg, targetWeightKg)
        : null,
      projectedWeightIn30DaysKg: projectWeightKg(
        weighingInputs,
        thirtyDaysOut.toISOString().slice(0, 10),
      ),
    };
  }
}
