import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AppConfig } from '../config/configuration';
import { GeminiContent } from './gemini-content';

export interface GenerateParams {
  systemInstruction: string;
  contents: GeminiContent[];
}

/**
 * Thin wrapper around the @google/genai SDK — isolates the one place that
 * knows about Gemini specifically, so swapping providers later (or adding a
 * second one) touches this file and not the assistant's own logic.
 *
 * `GEMINI_API_KEY` is expected to be a free-tier Google AI Studio key for
 * development. Google may use free-tier traffic to improve their products —
 * see .env.example and the README before pointing this at real farm data.
 */
@Injectable()
export class GeminiClientService {
  private readonly logger = new Logger(GeminiClientService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const app = this.configService.get<AppConfig>('app')!;
    this.client = app.geminiApiKey ? new GoogleGenAI({ apiKey: app.geminiApiKey }) : null;
    this.model = app.geminiModel;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generate(params: GenerateParams): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'The AI assistant is not configured — set GEMINI_API_KEY (see backend/.env.example)',
      );
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: params.contents,
        config: { systemInstruction: params.systemInstruction },
      });
      return response.text ?? '';
    } catch (error) {
      this.logger.error('Gemini request failed', error instanceof Error ? error.stack : error);
      throw new ServiceUnavailableException('The AI assistant is temporarily unavailable');
    }
  }
}
