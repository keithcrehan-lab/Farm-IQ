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
import { LivestockGroupsService } from './livestock-groups.service';
import { UpsertLivestockGroupDto } from './dto/upsert-livestock-group.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('livestock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/livestock-groups')
export class LivestockGroupsController {
  constructor(private readonly livestockGroupsService: LivestockGroupsService) {}

  /** PUT, not POST: recording a category's headcount replaces the existing figure for that category. */
  @Put()
  upsert(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: UpsertLivestockGroupDto,
  ) {
    return this.livestockGroupsService.upsert(farmId, user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.livestockGroupsService.findAllForFarm(farmId, user.id);
  }

  @Delete(':groupId')
  remove(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.livestockGroupsService.remove(farmId, groupId, user.id);
  }
}
