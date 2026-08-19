import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FertiliserProduct } from './fertiliser-product.entity';
import { FertiliserPlanService } from './fertiliser-plan.service';
import { FertiliserPlanController } from './fertiliser-plan.controller';
import { FarmsModule } from '../farms/farms.module';
import { FieldsModule } from '../fields/fields.module';
import { SoilTestsModule } from '../soil-tests/soil-tests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FertiliserProduct]),
    FarmsModule,
    FieldsModule,
    SoilTestsModule,
  ],
  providers: [FertiliserPlanService],
  controllers: [FertiliserPlanController],
  exports: [FertiliserPlanService],
})
export class FertiliserPlanModule {}
