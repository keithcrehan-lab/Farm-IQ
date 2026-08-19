import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GroupBuyOffersService } from './group-buy-offers.service';
import { CreateGroupBuyOfferDto } from './dto/create-group-buy-offer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NutrientCategory } from '../fertiliser-plan/fertiliser-product.entity';

/**
 * Platform-wide offer browsing/creation — not scoped to a farm. Creating an
 * offer is open to any authenticated user for this prototype; a real
 * deployment would restrict POST to an ops/admin role once one exists.
 */
@ApiTags('group-buy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('group-buy-offers')
export class GroupBuyOffersController {
  constructor(private readonly offersService: GroupBuyOffersService) {}

  @Post()
  create(@Body() dto: CreateGroupBuyOfferDto) {
    return this.offersService.create(dto);
  }

  @Get()
  findAll(
    @Query('county') county?: string,
    @Query('fertiliserProductCategory') fertiliserProductCategory?: NutrientCategory,
    @Query('includeExpired') includeExpired?: string,
  ) {
    return this.offersService.findAll({
      county,
      fertiliserProductCategory,
      includeExpired: includeExpired === 'true',
    });
  }

  @Get(':offerId')
  findOne(@Param('offerId', ParseUUIDPipe) offerId: string) {
    return this.offersService.findOne(offerId);
  }
}
