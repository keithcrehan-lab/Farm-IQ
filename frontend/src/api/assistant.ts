import { apiClient } from './client';
import type { LandUse } from './fields';
import type { SoilAnalysisResult } from './soilTests';
import type { FertiliserPlan } from './fertiliserPlan';
import type { HousingSummary } from './livestock';
import type { ProfitabilitySummary } from './profitability';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface FieldSummary {
  name: string;
  areaHa: number;
  landUse: LandUse;
  latestSoilTest: { sampleDate: string; ph: number; pIndex: number; kIndex: number } | null;
  soilAnalysis: SoilAnalysisResult | null;
}

export interface RelevantGroupBuyOffer {
  productName: string;
  county: string | null;
  typicalPricePerTonneEur: number;
  negotiatedPricePerTonneEur: number;
  expiresAt: string;
}

export interface FarmSnapshot {
  farm: { name: string; county: string | null; farmType: string };
  fields: FieldSummary[];
  fertiliserPlan: FertiliserPlan;
  housing: HousingSummary;
  profitability: ProfitabilitySummary;
  nearbyGroupBuyOffers: RelevantGroupBuyOffer[];
}

export interface AskAssistantResult {
  conversationId: string;
  answer: string;
  context: FarmSnapshot;
}

export function listConversations(farmId: string) {
  return apiClient
    .get<Conversation[]>(`/farms/${farmId}/assistant/conversations`)
    .then((r) => r.data);
}

export function getConversation(farmId: string, conversationId: string) {
  return apiClient
    .get<ConversationDetail>(`/farms/${farmId}/assistant/conversations/${conversationId}`)
    .then((r) => r.data);
}

export function deleteConversation(farmId: string, conversationId: string) {
  return apiClient.delete<void>(`/farms/${farmId}/assistant/conversations/${conversationId}`);
}

export function askAssistant(farmId: string, question: string, conversationId?: string) {
  return apiClient
    .post<AskAssistantResult>(`/farms/${farmId}/assistant/ask`, { question, conversationId })
    .then((r) => r.data);
}
