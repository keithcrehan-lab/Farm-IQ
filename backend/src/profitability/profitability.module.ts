import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enterprise } from './enterprise.entity';
import { Transaction } from './transaction.entity';
import { EnterprisesService } from './enterprises.service';
import { EnterprisesController } from './enterprises.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { ProfitabilityService } from './profitability.service';
import { ProfitabilityController } from './profitability.controller';
import { FarmsModule } from '../farms/farms.module';
import { FieldsModule } from '../fields/fields.module';

@Module({
  imports: [TypeOrmModule.forFeature([Enterprise, Transaction]), FarmsModule, FieldsModule],
  providers: [EnterprisesService, TransactionsService, ProfitabilityService],
  controllers: [EnterprisesController, TransactionsController, ProfitabilityController],
})
export class ProfitabilityModule {}
