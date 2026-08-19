import { Injectable } from '@nestjs/common';
import { AssistantContextService } from './assistant-context.service';
import { GeminiClientService } from './gemini-client.service';
import { ConversationsService } from './conversations.service';
import { MessageRole } from './message.entity';
import { AskAssistantDto } from './dto/ask-assistant.dto';
import {
  ASSISTANT_SYSTEM_INSTRUCTION,
  HistoryTurn,
  buildAssistantContents,
} from './assistant-prompt';
import { FarmSnapshot } from './farm-snapshot';

export interface AskAssistantResult {
  conversationId: string;
  answer: string;
  context: FarmSnapshot;
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly contextService: AssistantContextService,
    private readonly geminiClient: GeminiClientService,
    private readonly conversationsService: ConversationsService,
  ) {}

  getContext(farmId: string, ownerId: string): Promise<FarmSnapshot> {
    return this.contextService.build(farmId, ownerId);
  }

  async ask(farmId: string, ownerId: string, dto: AskAssistantDto): Promise<AskAssistantResult> {
    // Built (and, on the happy path, fully usable) even when Gemini itself is
    // unconfigured — GeminiClientService is the only thing that needs a key,
    // so context-gathering is exercised and verifiable independently of it.
    const context = await this.contextService.build(farmId, ownerId);

    let history: HistoryTurn[] = [];
    if (dto.conversationId) {
      // Ownership-checked here — a farm can only continue its own conversations.
      await this.conversationsService.findOneOwned(farmId, dto.conversationId, ownerId);
      const priorMessages = await this.conversationsService.getMessages(dto.conversationId);
      history = priorMessages.map((m) => ({ role: m.role, content: m.content }));
    }

    const contents = buildAssistantContents(history, JSON.stringify(context), dto.question);

    // Gemini is called BEFORE any conversation/message is persisted — a
    // failed call (unconfigured key, quota, network) leaves no half-written
    // conversation behind and no empty thread with zero messages.
    const answer = await this.geminiClient.generate({
      systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
      contents,
    });

    const conversationId =
      dto.conversationId ?? (await this.conversationsService.create(farmId)).id;
    await this.conversationsService.addMessage(conversationId, MessageRole.USER, dto.question);
    await this.conversationsService.addMessage(conversationId, MessageRole.ASSISTANT, answer);

    return { conversationId, answer, context };
  }
}
