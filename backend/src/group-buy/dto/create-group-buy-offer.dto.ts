import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { NutrientCategory } from '../../fertiliser-plan/fertiliser-product.entity';

export class CreateGroupBuyOfferDto {
  @ApiProperty({ example: 'Protected Urea 46% N' })
  @IsString()
  @MaxLength(80)
  productName: string;

  @ApiProperty({
    enum: NutrientCategory,
    required: false,
    description:
      "Set this to auto-fill a farm's requirement from its fertiliser plan (lime/phosphorus/potassium only). Omit for products this API has no requirement model for yet (e.g. nitrogen) — farmers state their own requirement when joining.",
  })
  @IsOptional()
  @IsEnum(NutrientCategory)
  fertiliserProductCategory?: NutrientCategory;

  @ApiProperty({ example: 'Galway', required: false, description: 'Omit for a nationwide offer' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  county?: string;

  @ApiProperty({ example: 560.0 })
  @IsPositive()
  typicalPricePerTonneEur: number;

  @ApiProperty({ example: 480.0 })
  @IsPositive()
  negotiatedPricePerTonneEur: number;

  @ApiProperty({ example: 150, description: 'Aggregate demand needed to unlock the deal' })
  @IsPositive()
  supplierThresholdTonnes: number;

  @ApiProperty({ example: '2026-09-05T23:59:59.000Z' })
  @IsDateString()
  expiresAt: string;
}
