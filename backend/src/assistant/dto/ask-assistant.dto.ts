import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class HistoryTurnDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  content: string;
}

export class AskAssistantDto {
  @ApiProperty({ example: 'How much silage will I need this winter?' })
  @IsString()
  @MaxLength(500)
  question: string;

  @ApiProperty({
    type: [HistoryTurnDto],
    required: false,
    description: 'Prior turns in this conversation, oldest first. Not persisted server-side.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => HistoryTurnDto)
  history?: HistoryTurnDto[];
}
