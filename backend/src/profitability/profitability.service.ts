import { Injectable } from '@nestjs/common';
import { FarmsService } from '../farms/farms.service';
import { FieldsService } from '../fields/fields.service';
import { EnterprisesService } from './enterprises.service';
import { TransactionsService } from './transactions.service';
import { ProfitabilitySummary, buildProfitabilitySummary } from './profitability-calculator';

@Injectable()
export class ProfitabilityService {
  constructor(
    private readonly farmsService: FarmsService,
    private readonly fieldsService: FieldsService,
    private readonly enterprisesService: EnterprisesService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getSummary(farmId: string, ownerId: string, year: number): Promise<ProfitabilitySummary> {
    await this.farmsService.findOneOwned(farmId, ownerId);

    const [currentYearTx, previousYearTx, enterprises, fields] = await Promise.all([
      this.transactionsService.findAllForFarmUnchecked(farmId, year),
      this.transactionsService.findAllForFarmUnchecked(farmId, year - 1),
      this.enterprisesService.findAllForFarmUnchecked(farmId),
      this.fieldsService.findAllForFarm(farmId, ownerId),
    ]);

    return buildProfitabilitySummary(
      year,
      currentYearTx.map((tx) => ({
        category: tx.category,
        amountEur: Number(tx.amountEur),
        enterpriseId: tx.enterpriseId,
        fieldId: tx.fieldId,
      })),
      previousYearTx.map((tx) => ({
        category: tx.category,
        amountEur: Number(tx.amountEur),
        enterpriseId: tx.enterpriseId,
        fieldId: tx.fieldId,
      })),
      enterprises.map((e) => ({ id: e.id, name: e.name, type: e.type })),
      fields.map((f) => ({ id: f.id, name: f.name, areaHa: Number(f.areaHa) })),
    );
  }
}
