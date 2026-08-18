import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HousingService } from './housing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('housing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/housing-summary')
export class HousingController {
  constructor(private readonly housingService: HousingService) {}

  @Get()
  getSummary(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.housingService.getSummary(farmId, user.id);
  }
}
