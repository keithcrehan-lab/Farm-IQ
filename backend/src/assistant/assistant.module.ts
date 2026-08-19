import { Module } from '@nestjs/common';
import { AssistantContextService } from './assistant-context.service';
import { GeminiClientService } from './gemini-client.service';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';
import { FarmsModule } from '../farms/farms.module';
import { FieldsModule } from '../fields/fields.module';
import { SoilTestsModule } from '../soil-tests/soil-tests.module';
import { FertiliserPlanModule } from '../fertiliser-plan/fertiliser-plan.module';
import { LivestockModule } from '../livestock/livestock.module';
import { ProfitabilityModule } from '../profitability/profitability.module';
import { GroupBuyModule } from '../group-buy/group-buy.module';

@Module({
  imports: [
    FarmsModule,
    FieldsModule,
    SoilTestsModule,
    FertiliserPlanModule,
    LivestockModule,
    ProfitabilityModule,
    GroupBuyModule,
  ],
  providers: [AssistantContextService, GeminiClientService, AssistantService],
  controllers: [AssistantController],
})
export class AssistantModule {}
