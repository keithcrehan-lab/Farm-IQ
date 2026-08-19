import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { LivestockCategory } from '../../livestock/livestock-group.entity';
import { AnimalSex } from '../animal.entity';

export class CreateAnimalDto {
  @ApiProperty({ example: 'IE324987654' })
  @IsString()
  @MaxLength(30)
  tagNumber: string;

  @ApiProperty({ enum: LivestockCategory, example: LivestockCategory.WEANLING })
  @IsEnum(LivestockCategory)
  category: LivestockCategory;

  @ApiProperty({ enum: AnimalSex })
  @IsEnum(AnimalSex)
  sex: AnimalSex;

  @ApiProperty({ example: 'Limousin', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  breed?: string;

  @ApiProperty({ example: '2025-03-14', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: 'IE111222333', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  damTagNumber?: string;

  @ApiProperty({ example: 'AI Bull 4521', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  sireTagNumber?: string;

  @ApiProperty({ example: '2025-06-01', required: false })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiProperty({ example: 850, required: false })
  @IsOptional()
  @IsPositive()
  purchasePriceEur?: number;

  @ApiProperty({ example: 650, required: false, description: 'Farmer-set finishing target' })
  @IsOptional()
  @IsPositive()
  targetWeightKg?: number;
}
