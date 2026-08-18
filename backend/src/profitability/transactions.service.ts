import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FarmsService } from '../farms/farms.service';
import { EnterprisesService } from './enterprises.service';
import { FieldsService } from '../fields/fields.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly farmsService: FarmsService,
    private readonly enterprisesService: EnterprisesService,
    private readonly fieldsService: FieldsService,
  ) {}

  async create(farmId: string, ownerId: string, dto: CreateTransactionDto): Promise<Transaction> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    // Cross-check optional references belong to the same farm — a transaction
    // can't silently attach itself to another farm's enterprise or field.
    if (dto.enterpriseId) {
      await this.enterprisesService.findOneOwned(farmId, dto.enterpriseId, ownerId);
    }
    if (dto.fieldId) {
      await this.fieldsService.findOneOwned(farmId, dto.fieldId, ownerId);
    }

    const transaction = this.transactionsRepository.create({
      farmId,
      category: dto.category,
      amountEur: dto.amountEur,
      transactionDate: dto.transactionDate,
      enterpriseId: dto.enterpriseId ?? null,
      fieldId: dto.fieldId ?? null,
      description: dto.description ?? null,
    });
    return this.transactionsRepository.save(transaction);
  }

  async findAllForFarm(farmId: string, ownerId: string, year?: number): Promise<Transaction[]> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    return this.findAllForFarmUnchecked(farmId, year);
  }

  /** Ownership-unchecked — for internal callers (e.g. ProfitabilityService) that already hold an owned Farm. */
  findAllForFarmUnchecked(farmId: string, year?: number): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: {
        farmId,
        ...(year ? { transactionDate: Between(`${year}-01-01`, `${year}-12-31`) } : {}),
      },
      order: { transactionDate: 'DESC' },
    });
  }

  async findOneOwned(farmId: string, transactionId: string, ownerId: string): Promise<Transaction> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId, farmId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(
    farmId: string,
    transactionId: string,
    ownerId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOneOwned(farmId, transactionId, ownerId);
    if (dto.enterpriseId) {
      await this.enterprisesService.findOneOwned(farmId, dto.enterpriseId, ownerId);
    }
    if (dto.fieldId) {
      await this.fieldsService.findOneOwned(farmId, dto.fieldId, ownerId);
    }
    Object.assign(transaction, dto);
    return this.transactionsRepository.save(transaction);
  }

  async remove(farmId: string, transactionId: string, ownerId: string): Promise<void> {
    const transaction = await this.findOneOwned(farmId, transactionId, ownerId);
    await this.transactionsRepository.remove(transaction);
  }
}
