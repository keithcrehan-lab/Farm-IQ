import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { LivestockCategory } from '../livestock-group.entity';

export class UpsertLivestockGroupDto {
  @ApiProperty({ enum: LivestockCategory, example: LivestockCategory.COW })
  @IsEnum(LivestockCategory)
  category: LivestockCategory;

  @ApiProperty({ example: 20, minimum: 0 })
  @IsInt()
  @Min(0)
  headCount: number;
}
