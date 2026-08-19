import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AskAssistantDto {
  @ApiProperty({ example: 'How much silage will I need this winter?' })
  @IsString()
  @MaxLength(500)
  question: string;

  @ApiProperty({
    required: false,
    description:
      'Continue an existing conversation (its prior messages become history). Omit to start a new one — its id comes back in the response.',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
