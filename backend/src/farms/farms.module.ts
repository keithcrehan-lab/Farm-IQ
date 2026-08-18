import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './farm.entity';
import { FarmsService } from './farms.service';
import { FarmsController } from './farms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Farm])],
  providers: [FarmsService],
  controllers: [FarmsController],
  exports: [FarmsService],
})
export class FarmsModule {}
