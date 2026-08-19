import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AssistantService } from './assistant.service';
import { AskAssistantDto } from './dto/ask-assistant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  /** The exact data snapshot the assistant would answer from — useful for debugging and for a frontend to show "what FarmReturn knows" alongside an answer. */
  @Get('context')
  getContext(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.assistantService.getContext(farmId, user.id);
  }

  @Post('ask')
  ask(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: AskAssistantDto,
  ) {
    return this.assistantService.ask(farmId, user.id, dto);
  }
}
