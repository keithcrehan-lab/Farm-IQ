import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import { askAssistant, getConversation, listConversations } from '../api/assistant';
import type { Conversation, Message } from '../api/assistant';
import { PageHeader } from '../components/PageHeader';
import { CenteredMessage, ErrorBanner } from '../components/Loading';
import { inputStyle } from '../components/formStyles';
import { SendIcon } from '../components/icons';

export function AssistantPage() {
  const { farm } = useFarm();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!farm) return;
    try {
      setConversations(await listConversations(farm.id));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your conversations.'));
    }
  }, [farm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch, setState follows a network await
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openConversation(id: string) {
    if (!farm) return;
    try {
      const detail = await getConversation(farm.id, id);
      setConversationId(id);
      setMessages(detail.messages);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not open this conversation.'));
    }
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
  }

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    if (!farm || !question.trim()) return;
    const asked = question.trim();
    setQuestion('');
    setSending(true);
    setError(null);

    const optimisticUser: Message = {
      id: `pending-${Date.now()}`,
      conversationId: conversationId ?? '',
      role: 'user',
      content: asked,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const result = await askAssistant(farm.id, asked, conversationId ?? undefined);
      setConversationId(result.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `answer-${Date.now()}`,
          conversationId: result.conversationId,
          role: 'assistant',
          content: result.answer,
          createdAt: new Date().toISOString(),
        },
      ]);
      setConversations(await listConversations(farm.id));
    } catch (err) {
      setError(extractErrorMessage(err, 'The assistant could not answer that.'));
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setQuestion(asked);
    } finally {
      setSending(false);
    }
  }

  if (!farm) return null;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="AI Assistant" subtitle={farm.name} />

      <div style={{ padding: '12px 24px 0' }}>
        {conversations && conversations.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            <ChipButton active={conversationId === null} onClick={startNewConversation}>
              New chat
            </ChipButton>
            {conversations.map((c, i) => (
              <ChipButton key={c.id} active={conversationId === c.id} onClick={() => openConversation(c.id)}>
                {`Conversation ${conversations.length - i}`}
              </ChipButton>
            ))}
          </div>
        )}

        {error && <ErrorBanner message={error} />}
      </div>

      <div style={{ flex: 1, padding: '4px 24px 12px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 220 }}>
        {conversations === null && !error && <CenteredMessage text="Loading…" />}
        {conversations && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ink-2)', fontSize: 13.5, fontWeight: 600, padding: '30px 10px' }}>
            Ask about your soil, fertiliser plan, housing capacity or margin — the assistant answers from your
            farm's real numbers, not guesses.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '80%',
                background: m.role === 'user' ? 'var(--forest)' : 'var(--surface)',
                color: m.role === 'user' ? 'white' : 'var(--ink)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: 16,
                padding: '10px 14px',
                fontSize: 13.5,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '10px 14px',
                fontSize: 13.5,
                color: 'var(--ink-2)',
              }}
            >
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleAsk}
        style={{
          position: 'sticky',
          bottom: 76,
          background: 'var(--bg)',
          padding: '8px 24px 4px',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask FarmReturn…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="submit"
          disabled={sending || !question.trim()}
          style={{
            background: 'var(--forest)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            width: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flex: 'none',
          }}
        >
          <SendIcon size={17} />
        </button>
      </form>
    </div>
  );
}

function ChipButton({ children, active, onClick }: { children: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 'none',
        background: active ? 'var(--forest)' : 'var(--surface)',
        color: active ? 'white' : 'var(--ink-2)',
        border: `1px solid ${active ? 'var(--forest)' : 'var(--border)'}`,
        borderRadius: 100,
        padding: '6px 12px',
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
