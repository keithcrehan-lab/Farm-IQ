import { useState } from 'react';
import type { FormEvent } from 'react';
import { extractErrorMessage } from '../api/client';
import { createFarm } from '../api/farms';
import type { FarmType } from '../api/farms';
import { buttonStyle, inputStyle } from './formStyles';

export function CreateFarmPrompt({
  userName,
  onCreated,
}: {
  userName: string | null | undefined;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [county, setCounty] = useState('');
  const [farmType, setFarmType] = useState<FarmType>('mixed');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createFarm({ name, county: county || undefined, farmType });
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create your farm.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '60px auto 0', padding: '0 24px' }}>
      <div className="serif" style={{ fontSize: 24, marginBottom: 6 }}>
        {userName ? `Welcome, ${userName}` : 'Welcome to FarmReturn'}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 22 }}>
        Let's set up your farm.
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>Farm name</span>
          <input
            required
            placeholder="Home Farm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>County</span>
          <input
            placeholder="Galway"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>Farm type</span>
          <select
            value={farmType}
            onChange={(e) => setFarmType(e.target.value as FarmType)}
            style={inputStyle}
          >
            <option value="suckler">Suckler</option>
            <option value="dairy">Dairy</option>
            <option value="sheep">Sheep</option>
            <option value="tillage">Tillage</option>
            <option value="mixed">Mixed</option>
            <option value="other">Other</option>
          </select>
        </label>

        {error && <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>{error}</div>}

        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? 'Creating…' : 'Create farm'}
        </button>
      </form>
    </div>
  );
}
