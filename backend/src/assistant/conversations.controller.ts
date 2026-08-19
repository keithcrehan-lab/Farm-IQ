import { Controller, Delete, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/assistant/conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.conversationsService.findAllForFarm(farmId, user.id);
  }

  @Get(':conversationId')
  async getMessages(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    const conversation = await this.conversationsService.findOneOwned(
      farmId,
      conversationId,
      user.id,
    );
    const messages = await this.conversationsService.getMessages(conversationId);
    return { ...conversation, messages };
  }

  @Delete(':conversationId')
  remove(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.remove(farmId, conversationId, user.id);
  }
}
