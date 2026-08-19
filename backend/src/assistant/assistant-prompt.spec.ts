import { buildAssistantContents } from './assistant-prompt';

describe('buildAssistantContents', () => {
  it('maps history turns to Gemini roles (assistant -> model) in order', () => {
    const contents = buildAssistantContents(
      [
        { role: 'user', content: 'How much silage will I need?' },
        { role: 'assistant', content: 'Based on your herd, 485 tonnes.' },
      ],
      '{}',
      'And the shortfall?',
    );

    expect(contents[0]).toEqual({
      role: 'user',
      parts: [{ text: 'How much silage will I need?' }],
    });
    expect(contents[1]).toEqual({
      role: 'model',
      parts: [{ text: 'Based on your herd, 485 tonnes.' }],
    });
  });

  it('appends one final user turn carrying the farm snapshot and the new question together', () => {
    const contents = buildAssistantContents(
      [],
      '{"totals":{"marginEur":46700}}',
      'How did I do this year?',
    );
    const finalTurn = contents[contents.length - 1];

    expect(finalTurn.role).toBe('user');
    expect(finalTurn.parts).toHaveLength(1);
    expect(finalTurn.parts[0].text).toContain('"marginEur":46700');
    expect(finalTurn.parts[0].text).toContain('How did I do this year?');
  });

  it('works with no history at all (first question in a session)', () => {
    const contents = buildAssistantContents([], '{}', 'Which fields need lime?');
    expect(contents).toHaveLength(1);
    expect(contents[0].role).toBe('user');
  });
});
