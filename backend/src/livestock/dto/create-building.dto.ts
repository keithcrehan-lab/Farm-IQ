import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, MaxLength, Min } from 'class-validator';
import { BuildingType } from '../building.entity';

export class CreateBuildingDto {
  @ApiProperty({ example: 'Shed 1' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiProperty({ enum: BuildingType, example: BuildingType.SLATTED })
  @IsEnum(BuildingType)
  type: BuildingType;

  @ApiProperty({ example: 32, minimum: 1 })
  @IsInt()
  @Min(1)
  capacityHead: number;
}
