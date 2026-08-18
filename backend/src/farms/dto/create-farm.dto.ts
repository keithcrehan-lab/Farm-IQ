import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FarmType } from '../farm.entity';

export class CreateFarmDto {
  @ApiProperty({ example: 'Home Farm' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'Galway', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  county?: string;

  @ApiProperty({ example: 'IE123456', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  herdNumber?: string;

  @ApiProperty({ enum: FarmType, example: FarmType.SUCKLER, required: false })
  @IsOptional()
  @IsEnum(FarmType)
  farmType?: FarmType;
}
