import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Animal } from './animal.entity';
import { AnimalWeight } from './animal-weight.entity';
import { AnimalsService } from './animals.service';
import { AnimalsController } from './animals.controller';
import { AnimalWeightsService } from './animal-weights.service';
import { AnimalWeightsController } from './animal-weights.controller';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Animal, AnimalWeight]), FarmsModule],
  providers: [AnimalsService, AnimalWeightsService],
  controllers: [AnimalsController, AnimalWeightsController],
  exports: [AnimalsService, AnimalWeightsService],
})
export class AnimalsModule {}
