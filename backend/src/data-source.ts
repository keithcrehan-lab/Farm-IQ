import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Farm } from './farms/farm.entity';
import { Field } from './fields/field.entity';
import { SoilTest } from './soil-tests/soil-test.entity';
import { FertiliserProduct } from './fertiliser-plan/fertiliser-product.entity';

config();

/**
 * Standalone DataSource used by the TypeORM CLI (migration:generate / :run / :revert).
 * The running app builds its own connection via TypeOrmModule.forRootAsync in
 * app.module.ts — this file exists only so `npm run typeorm` has something to point at.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://farmreturn:farmreturn@localhost:5432/farmreturn',
  entities: [User, Farm, Field, SoilTest, FertiliserProduct],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
