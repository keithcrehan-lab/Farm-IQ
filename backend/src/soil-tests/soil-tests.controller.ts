import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SoilTestsService } from './soil-tests.service';
import { CreateSoilTestDto } from './dto/create-soil-test.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('soil-tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/fields/:fieldId/soil-tests')
export class SoilTestsController {
  constructor(private readonly soilTestsService: SoilTestsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: CreateSoilTestDto,
  ) {
    return this.soilTestsService.create(farmId, fieldId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
  ) {
    return this.soilTestsService.findAllForField(farmId, fieldId, user.id);
  }

  @Get(':testId')
  findOne(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
  ) {
    return this.soilTestsService.findOneOwned(farmId, fieldId, testId, user.id);
  }

  @Get(':testId/analysis')
  analyze(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
  ) {
    return this.soilTestsService.analyze(farmId, fieldId, testId, user.id);
  }
}
