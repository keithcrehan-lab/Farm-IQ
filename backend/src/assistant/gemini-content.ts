/**
 * Local shape for a Gemini chat turn — kept independent of `@google/genai`'s
 * own exported types so the pure prompt-building logic in this module has no
 * SDK import and can be unit-tested without touching the network client.
 */
export interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}
