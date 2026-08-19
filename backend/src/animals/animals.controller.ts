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
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('animals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreateAnimalDto,
  ) {
    return this.animalsService.create(farmId, user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.animalsService.findAllForFarm(farmId, user.id);
  }

  @Get(':animalId')
  findOne(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('animalId', ParseUUIDPipe) animalId: string,
  ) {
    return this.animalsService.findOneOwned(farmId, animalId, user.id);
  }

  @Patch(':animalId')
  update(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('animalId', ParseUUIDPipe) animalId: string,
    @Body() dto: UpdateAnimalDto,
  ) {
    return this.animalsService.update(farmId, animalId, user.id, dto);
  }

  @Delete(':animalId')
  remove(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('animalId', ParseUUIDPipe) animalId: string,
  ) {
    return this.animalsService.remove(farmId, animalId, user.id);
  }
}
