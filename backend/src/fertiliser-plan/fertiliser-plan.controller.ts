import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FertiliserPlanService } from './fertiliser-plan.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('fertiliser-plan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/fertiliser-plan')
export class FertiliserPlanController {
  constructor(private readonly fertiliserPlanService: FertiliserPlanService) {}

  @Get()
  generate(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.fertiliserPlanService.generateForFarm(farmId, user.id);
  }
}
