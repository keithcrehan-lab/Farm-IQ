import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration, { AppConfig } from './config/configuration';
import { User } from './users/user.entity';
import { Farm } from './farms/farm.entity';
import { Field } from './fields/field.entity';
import { SoilTest } from './soil-tests/soil-test.entity';
import { FertiliserProduct } from './fertiliser-plan/fertiliser-product.entity';
import { LivestockGroup } from './livestock/livestock-group.entity';
import { Building } from './livestock/building.entity';
import { Enterprise } from './profitability/enterprise.entity';
import { Transaction } from './profitability/transaction.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { FieldsModule } from './fields/fields.module';
import { SoilTestsModule } from './soil-tests/soil-tests.module';
import { FertiliserPlanModule } from './fertiliser-plan/fertiliser-plan.module';
import { LivestockModule } from './livestock/livestock.module';
import { ProfitabilityModule } from './profitability/profitability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const app = configService.get<AppConfig>('app')!;
        return {
          type: 'postgres' as const,
          url: app.databaseUrl,
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
          ],
          synchronize: app.dbSynchronize,
          autoLoadEntities: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    FarmsModule,
    FieldsModule,
    SoilTestsModule,
    FertiliserPlanModule,
    LivestockModule,
    ProfitabilityModule,
  ],
})
export class AppModule {}
