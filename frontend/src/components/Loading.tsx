export function CenteredMessage({ text }: { text: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 20px',
        color: 'var(--ink-2)',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {text}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ padding: '0 20px' }}>
      <div
        style={{
          background: 'var(--red-tint)',
          color: 'var(--red)',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        {message}
      </div>
    </div>
  );
}
