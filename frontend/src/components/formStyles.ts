import type { CSSProperties } from 'react';

export const inputStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '11px 12px',
  fontSize: 14.5,
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'var(--surface)',
};

export const buttonStyle: CSSProperties = {
  background: 'var(--forest)',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  padding: '13px',
  fontSize: 14.5,
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: 4,
};
