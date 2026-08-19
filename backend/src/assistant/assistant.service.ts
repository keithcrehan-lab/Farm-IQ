import { Injectable } from '@nestjs/common';
import { AssistantContextService } from './assistant-context.service';
import { GeminiClientService } from './gemini-client.service';
import { AskAssistantDto } from './dto/ask-assistant.dto';
import { ASSISTANT_SYSTEM_INSTRUCTION, buildAssistantContents } from './assistant-prompt';
import { FarmSnapshot } from './farm-snapshot';

export interface AskAssistantResult {
  answer: string;
  context: FarmSnapshot;
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly contextService: AssistantContextService,
    private readonly geminiClient: GeminiClientService,
  ) {}

  getContext(farmId: string, ownerId: string): Promise<FarmSnapshot> {
    return this.contextService.build(farmId, ownerId);
  }

  async ask(farmId: string, ownerId: string, dto: AskAssistantDto): Promise<AskAssistantResult> {
    // Built (and, on the happy path, fully usable) even when Gemini itself is
    // unconfigured — GeminiClientService is the only thing that needs a key,
    // so context-gathering is exercised and verifiable independently of it.
    const context = await this.contextService.build(farmId, ownerId);

    const contents = buildAssistantContents(
      dto.history ?? [],
      JSON.stringify(context),
      dto.question,
    );

    const answer = await this.geminiClient.generate({
      systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
      contents,
    });

    return { answer, context };
  }
}
