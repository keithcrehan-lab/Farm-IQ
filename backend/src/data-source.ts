import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Farm } from './farms/farm.entity';
import { Field } from './fields/field.entity';
import { SoilTest } from './soil-tests/soil-test.entity';
import { FertiliserProduct } from './fertiliser-plan/fertiliser-product.entity';
import { LivestockGroup } from './livestock/livestock-group.entity';
import { Building } from './livestock/building.entity';
import { Enterprise } from './profitability/enterprise.entity';
import { Transaction } from './profitability/transaction.entity';
import { GroupBuyOffer } from './group-buy/group-buy-offer.entity';
import { GroupBuyParticipant } from './group-buy/group-buy-participant.entity';

config();

/**
 * Standalone DataSource used by the TypeORM CLI (migration:generate / :run / :revert).
 * The running app builds its own connection via TypeOrmModule.forRootAsync in
 * app.module.ts — this file exists only so `npm run typeorm` has something to point at.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://farmreturn:farmreturn@localhost:5432/farmreturn',
  entities: [
    User,
    Farm,
    Field,
    SoilTest,
    FertiliserProduct,
    LivestockGroup,
    Building,
    Enterprise,
    Transaction,
    GroupBuyOffer,
    GroupBuyParticipant,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
