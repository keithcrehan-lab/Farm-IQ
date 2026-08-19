import type { CSSProperties, ReactNode } from 'react';

export function Card({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Card style={{ textAlign: 'center', color: 'var(--ink-2)', fontSize: 13.5, fontWeight: 600 }}>
      {text}
    </Card>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'bad' | 'warn' }) {
  const palette: Record<string, [string, string]> = {
    neutral: ['var(--surface-2)', 'var(--ink-2)'],
    good: ['var(--green-tint)', 'var(--green-ok)'],
    bad: ['var(--red-tint)', 'var(--red)'],
    warn: ['var(--amber-tint)', 'var(--amber)'],
  };
  const [bg, fg] = palette[tone];
  return (
    <span
      style={{
        background: bg,
        color: fg,
        fontSize: 11.5,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 100,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export const eur = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 });
export const eur2 = new Intl.NumberFormat('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
