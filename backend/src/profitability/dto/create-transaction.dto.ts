import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TransactionCategory } from '../transaction-category.constants';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionCategory, example: TransactionCategory.LIVESTOCK_SALES })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiProperty({
    example: 1450.0,
    description: 'Always positive — income or expense is derived from category',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountEur: number;

  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ required: false, description: 'Assign this entry to an enterprise' })
  @IsOptional()
  @IsUUID()
  enterpriseId?: string;

  @ApiProperty({ required: false, description: 'Assign this entry to a field (drives return/ha)' })
  @IsOptional()
  @IsUUID()
  fieldId?: string;

  @ApiProperty({ required: false, example: '8 weanlings, Athenry mart' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
