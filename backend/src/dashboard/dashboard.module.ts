import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { FarmsModule } from '../farms/farms.module';
import { FieldsModule } from '../fields/fields.module';
import { SoilTestsModule } from '../soil-tests/soil-tests.module';
import { LivestockModule } from '../livestock/livestock.module';
import { ProfitabilityModule } from '../profitability/profitability.module';
import { GroupBuyModule } from '../group-buy/group-buy.module';

@Module({
  imports: [
    FarmsModule,
    FieldsModule,
    SoilTestsModule,
    LivestockModule,
    ProfitabilityModule,
    GroupBuyModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
