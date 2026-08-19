import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsPositive } from 'class-validator';
import { CreateAnimalDto } from './create-animal.dto';
import { AnimalStatus } from '../animal.entity';

export class UpdateAnimalDto extends PartialType(CreateAnimalDto) {
  @ApiProperty({ enum: AnimalStatus, required: false })
  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus;

  @ApiProperty({ example: '2026-11-20', required: false })
  @IsOptional()
  @IsDateString()
  saleDate?: string;

  @ApiProperty({ example: 655, required: false })
  @IsOptional()
  @IsPositive()
  saleWeightKg?: number;

  @ApiProperty({ example: 1630, required: false })
  @IsOptional()
  @IsPositive()
  salePriceEur?: number;
}
