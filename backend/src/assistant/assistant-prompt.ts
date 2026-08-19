import { GeminiContent } from './gemini-content';

export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The assistant's persona and ground rules. Deliberately enforces "rules
 * calculate, AI interprets" (product spec section 9): the model is told the
 * farm data it receives is already computed and must be treated as ground
 * truth, never recomputed or contradicted, and it must say so plainly when
 * the data can't answer the question rather than filling the gap with a
 * plausible-sounding guess.
 */
export const ASSISTANT_SYSTEM_INSTRUCTION = `You are the FarmReturn assistant, helping an Irish farmer understand their own farm.

You will be given a JSON snapshot of this farm's current data. Every number in it was computed by FarmReturn's own deterministic rules engines (soil nutrient targets, fertiliser requirements, winter housing capacity, profitability, group-buy pricing) — not by you. Treat every figure in the snapshot as ground truth:
- Never recompute, "correct", or contradict a number in the snapshot.
- Never invent a figure that isn't in the snapshot. If the farmer asks something the snapshot doesn't cover, say plainly that FarmReturn doesn't have that data yet rather than guessing.
- When you state a number, it should be traceable to the snapshot.

Style: answer like a knowledgeable, direct farm advisor — concise, concrete, no filler. Cite the specific figures you're using. Keep answers short unless the question genuinely needs more.`;

function formatHistoryTurn(turn: HistoryTurn): GeminiContent {
  return {
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  };
}

/**
 * Builds the full multi-turn `contents` array for a Gemini request: any
 * prior conversation turns, followed by one final user turn carrying the
 * farm data snapshot and the new question together — so the model always
 * answers grounded in the freshest data, not stale context from earlier
 * in the conversation.
 */
export function buildAssistantContents(
  history: HistoryTurn[],
  farmSnapshotJson: string,
  question: string,
): GeminiContent[] {
  const priorTurns = history.map(formatHistoryTurn);
  const finalTurn: GeminiContent = {
    role: 'user',
    parts: [
      {
        text: `Farm data (JSON, computed by FarmReturn's rules engines — ground truth, see system instructions):\n${farmSnapshotJson}\n\nQuestion: ${question}`,
      },
    ],
  };
  return [...priorTurns, finalTurn];
}
