import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GroupBuyParticipantsService } from './group-buy-participants.service';
import { JoinGroupBuyOfferDto } from './dto/join-group-buy-offer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('group-buy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/group-buy-offers')
export class GroupBuyParticipationController {
  constructor(private readonly participantsService: GroupBuyParticipantsService) {}

  /** The offer personalized for this farm: its requirement, savings, aggregate progress, join status. */
  @Get(':offerId')
  getFarmView(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.participantsService.getFarmView(offerId, farmId, user.id);
  }

  @Put(':offerId/join')
  join(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: JoinGroupBuyOfferDto,
  ) {
    return this.participantsService.join(offerId, farmId, user.id, dto);
  }

  @Delete(':offerId/join')
  leave(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.participantsService.leave(offerId, farmId, user.id);
  }
}
