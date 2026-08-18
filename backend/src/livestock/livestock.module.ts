import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LivestockGroup } from './livestock-group.entity';
import { Building } from './building.entity';
import { LivestockGroupsService } from './livestock-groups.service';
import { LivestockGroupsController } from './livestock-groups.controller';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { HousingService } from './housing.service';
import { HousingController } from './housing.controller';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [TypeOrmModule.forFeature([LivestockGroup, Building]), FarmsModule],
  providers: [LivestockGroupsService, BuildingsService, HousingService],
  controllers: [LivestockGroupsController, BuildingsController, HousingController],
})
export class LivestockModule {}
