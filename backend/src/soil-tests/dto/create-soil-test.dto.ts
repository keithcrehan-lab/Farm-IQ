import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSoilTestDto {
  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  sampleDate: string;

  @ApiProperty({ example: 'Southern Scientific Services', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  labName?: string;

  @ApiProperty({ example: 6.2, minimum: 3, maximum: 9 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(3)
  @Max(9)
  ph: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 4, description: 'Teagasc-style index, 1-4' })
  @IsInt()
  @Min(1)
  @Max(4)
  pIndex: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  kIndex: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 4, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  mgIndex?: number;

  @ApiProperty({ example: 6.8, required: false, description: 'Organic matter, %' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  organicMatterPct?: number;
}
