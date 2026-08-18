import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { FarmType } from '../../farms/farm.entity';

export class CreateEnterpriseDto {
  @ApiProperty({ example: 'Suckler' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiProperty({ enum: FarmType, example: FarmType.SUCKLER })
  @IsEnum(FarmType)
  type: FarmType;
}
