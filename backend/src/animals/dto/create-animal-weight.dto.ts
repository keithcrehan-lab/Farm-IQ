import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsPositive } from 'class-validator';

export class CreateAnimalWeightDto {
  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  weighDate: string;

  @ApiProperty({ example: 468 })
  @IsPositive()
  weightKg: number;
}
