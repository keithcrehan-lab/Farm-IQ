import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EnterprisesService } from './enterprises.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('enterprises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/enterprises')
export class EnterprisesController {
  constructor(private readonly enterprisesService: EnterprisesService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreateEnterpriseDto,
  ) {
    return this.enterprisesService.create(farmId, user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.enterprisesService.findAllForFarm(farmId, user.id);
  }

  @Patch(':enterpriseId')
  update(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('enterpriseId', ParseUUIDPipe) enterpriseId: string,
    @Body() dto: UpdateEnterpriseDto,
  ) {
    return this.enterprisesService.update(farmId, enterpriseId, user.id, dto);
  }

  @Delete(':enterpriseId')
  remove(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('enterpriseId', ParseUUIDPipe) enterpriseId: string,
  ) {
    return this.enterprisesService.remove(farmId, enterpriseId, user.id);
  }
}
