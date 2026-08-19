import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupBuyParticipant } from './group-buy-participant.entity';
import { GroupBuyOffer } from './group-buy-offer.entity';
import { GroupBuyOffersService } from './group-buy-offers.service';
import { JoinGroupBuyOfferDto } from './dto/join-group-buy-offer.dto';
import { FarmsService } from '../farms/farms.service';
import { FertiliserPlanService } from '../fertiliser-plan/fertiliser-plan.service';
import {
  OfferProgress,
  PersonalizedOffer,
  computeOfferProgress,
  isOfferExpired,
  personalizeOffer,
} from './group-buy-calculator';

export interface FarmOfferView {
  offer: GroupBuyOffer;
  progress: OfferProgress;
  isExpired: boolean;
  requirementSource: 'fertiliser_plan' | 'manual' | 'unknown';
  personalized: PersonalizedOffer | null;
  alreadyJoined: boolean;
  joinedQuantityTonnes: number | null;
}

@Injectable()
export class GroupBuyParticipantsService {
  constructor(
    @InjectRepository(GroupBuyParticipant)
    private readonly participantsRepository: Repository<GroupBuyParticipant>,
    private readonly offersService: GroupBuyOffersService,
    private readonly farmsService: FarmsService,
    private readonly fertiliserPlanService: FertiliserPlanService,
  ) {}

  /** The farm's requirement for this offer's product, straight from its fertiliser plan — never guessed. */
  private async requirementFromFertiliserPlan(
    offer: GroupBuyOffer,
    farmId: string,
    ownerId: string,
  ): Promise<number | null> {
    if (!offer.fertiliserProductCategory) return null;
    const plan = await this.fertiliserPlanService.generateForFarm(farmId, ownerId);
    const match = plan.products.find((p) => p.category === offer.fertiliserProductCategory);
    return match ? match.quantityTonnes : 0; // 0: plan currently shows no need for this nutrient
  }

  async getFarmView(offerId: string, farmId: string, ownerId: string): Promise<FarmOfferView> {
    const offer = await this.offersService.findOne(offerId);
    await this.farmsService.findOneOwned(farmId, ownerId);

    const [participants, existing] = await Promise.all([
      this.participantsRepository.find({ where: { offerId } }),
      this.participantsRepository.findOne({ where: { offerId, farmId } }),
    ]);
    const progress = computeOfferProgress(
      participants.map((p) => Number(p.quantityTonnes)),
      Number(offer.supplierThresholdTonnes),
    );

    let requirementTonnes: number | null = null;
    let requirementSource: FarmOfferView['requirementSource'] = 'unknown';

    if (existing) {
      requirementTonnes = Number(existing.quantityTonnes);
      requirementSource = 'manual'; // already committed — treat the snapshot as authoritative
    } else {
      const fromPlan = await this.requirementFromFertiliserPlan(offer, farmId, ownerId);
      if (fromPlan !== null) {
        requirementTonnes = fromPlan;
        requirementSource = 'fertiliser_plan';
      }
    }

    const pricing = {
      typicalPricePerTonneEur: Number(offer.typicalPricePerTonneEur),
      negotiatedPricePerTonneEur: Number(offer.negotiatedPricePerTonneEur),
    };

    return {
      offer,
      progress,
      isExpired: isOfferExpired(offer.expiresAt),
      requirementSource,
      personalized:
        requirementTonnes !== null ? personalizeOffer(pricing, requirementTonnes) : null,
      alreadyJoined: !!existing,
      joinedQuantityTonnes: existing ? Number(existing.quantityTonnes) : null,
    };
  }

  async join(
    offerId: string,
    farmId: string,
    ownerId: string,
    dto: JoinGroupBuyOfferDto,
  ): Promise<GroupBuyParticipant> {
    const offer = await this.offersService.findOne(offerId);
    await this.farmsService.findOneOwned(farmId, ownerId);

    if (isOfferExpired(offer.expiresAt)) {
      throw new BadRequestException('This offer has expired');
    }

    let quantityTonnes = dto.quantityTonnes;
    if (quantityTonnes === undefined) {
      const fromPlan = await this.requirementFromFertiliserPlan(offer, farmId, ownerId);
      if (fromPlan === null) {
        throw new BadRequestException(
          'This offer has no automatic requirement for this product — specify quantityTonnes to join',
        );
      }
      if (fromPlan === 0) {
        throw new BadRequestException(
          'Your fertiliser plan currently shows no requirement for this product — specify quantityTonnes to join anyway',
        );
      }
      quantityTonnes = fromPlan;
    }

    const existing = await this.participantsRepository.findOne({ where: { offerId, farmId } });
    if (existing) {
      existing.quantityTonnes = quantityTonnes;
      return this.participantsRepository.save(existing);
    }

    const participant = this.participantsRepository.create({ offerId, farmId, quantityTonnes });
    return this.participantsRepository.save(participant);
  }

  async leave(offerId: string, farmId: string, ownerId: string): Promise<void> {
    await this.offersService.findOne(offerId);
    await this.farmsService.findOneOwned(farmId, ownerId);

    const participant = await this.participantsRepository.findOne({ where: { offerId, farmId } });
    if (!participant) {
      throw new NotFoundException('This farm has not joined this offer');
    }
    await this.participantsRepository.remove(participant);
  }
}
