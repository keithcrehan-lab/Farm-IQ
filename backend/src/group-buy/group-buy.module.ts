import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupBuyOffer } from './group-buy-offer.entity';
import { GroupBuyParticipant } from './group-buy-participant.entity';
import { GroupBuyOffersService } from './group-buy-offers.service';
import { GroupBuyOffersController } from './group-buy-offers.controller';
import { GroupBuyParticipantsService } from './group-buy-participants.service';
import { GroupBuyParticipationController } from './group-buy-participation.controller';
import { FarmsModule } from '../farms/farms.module';
import { FertiliserPlanModule } from '../fertiliser-plan/fertiliser-plan.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupBuyOffer, GroupBuyParticipant]),
    FarmsModule,
    FertiliserPlanModule,
  ],
  providers: [GroupBuyOffersService, GroupBuyParticipantsService],
  controllers: [GroupBuyOffersController, GroupBuyParticipationController],
})
export class GroupBuyModule {}
