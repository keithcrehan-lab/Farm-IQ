import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoilTest } from './soil-test.entity';
import { SoilTestsService } from './soil-tests.service';
import { SoilTestsController } from './soil-tests.controller';
import { SoilIntelligenceService } from './soil-intelligence.service';
import { FieldsModule } from '../fields/fields.module';

@Module({
  imports: [TypeOrmModule.forFeature([SoilTest]), FieldsModule],
  providers: [SoilTestsService, SoilIntelligenceService],
  controllers: [SoilTestsController],
  exports: [SoilIntelligenceService, SoilTestsService],
})
export class SoilTestsModule {}
