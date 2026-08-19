import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnimalWeightsService } from './animal-weights.service';
import { CreateAnimalWeightDto } from './dto/create-animal-weight.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('animals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/animals/:animalId/weights')
export class AnimalWeightsController {
  constructor(private readonly animalWeightsService: AnimalWeightsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('animalId', ParseUUIDPipe) animalId: string,
    @Body() dto: CreateAnimalWeightDto,
  ) {
    return this.animalWeightsService.create(farmId, animalId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('animalId', ParseUUIDPipe) animalId: string,
  ) {
    return this.animalWeightsService.findAllForAnimal(farmId, animalId, user.id);
  }

  @Get('analysis')
  getAnalysis(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('animalId', ParseUUIDPipe) animalId: string,
  ) {
    return this.animalWeightsService.getAnalysis(farmId, animalId, user.id);
  }
}
