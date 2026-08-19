import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { GroupBuyOffer } from './group-buy-offer.entity';
import { CreateGroupBuyOfferDto } from './dto/create-group-buy-offer.dto';
import { NutrientCategory } from '../fertiliser-plan/fertiliser-product.entity';

export interface FindOffersFilter {
  county?: string;
  fertiliserProductCategory?: NutrientCategory;
  includeExpired?: boolean;
}

@Injectable()
export class GroupBuyOffersService {
  constructor(
    @InjectRepository(GroupBuyOffer)
    private readonly offersRepository: Repository<GroupBuyOffer>,
  ) {}

  async create(dto: CreateGroupBuyOfferDto): Promise<GroupBuyOffer> {
    if (dto.negotiatedPricePerTonneEur >= dto.typicalPricePerTonneEur) {
      throw new BadRequestException(
        'negotiatedPricePerTonneEur must be lower than typicalPricePerTonneEur',
      );
    }
    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('expiresAt must be in the future');
    }

    const offer = this.offersRepository.create({
      productName: dto.productName,
      fertiliserProductCategory: dto.fertiliserProductCategory ?? null,
      county: dto.county ?? null,
      typicalPricePerTonneEur: dto.typicalPricePerTonneEur,
      negotiatedPricePerTonneEur: dto.negotiatedPricePerTonneEur,
      supplierThresholdTonnes: dto.supplierThresholdTonnes,
      expiresAt,
    });
    return this.offersRepository.save(offer);
  }

  findAll(filter: FindOffersFilter): Promise<GroupBuyOffer[]> {
    return this.offersRepository.find({
      where: {
        ...(filter.county ? { county: filter.county } : {}),
        ...(filter.fertiliserProductCategory
          ? { fertiliserProductCategory: filter.fertiliserProductCategory }
          : {}),
        ...(filter.includeExpired ? {} : { expiresAt: MoreThan(new Date()) }),
      },
      order: { expiresAt: 'ASC' },
    });
  }

  async findOne(offerId: string): Promise<GroupBuyOffer> {
    const offer = await this.offersRepository.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Group buy offer not found');
    }
    return offer;
  }
}
