import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/client';
import { createFarm, listFarms } from '../api/farms';
import type { Farm, FarmType } from '../api/farms';
import { getDashboard } from '../api/dashboard';
import type { AlertCategory, AlertSeverity, Dashboard, DashboardAlert } from '../api/dashboard';
import { buttonStyle, inputStyle } from '../components/formStyles';

const eur = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 });

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [farm, setFarm] = useState<Farm | null | undefined>(undefined); // undefined = still checking
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  // No setState before the first await — an async function called from an
  // effect must not run setState synchronously in that same turn.
  const loadFarmAndDashboard = useCallback(async () => {
    try {
      const farms = await listFarms();
      if (farms.length === 0) {
        setFarm(null);
        return;
      }
      setFarm(farms[0]);
      const dash = await getDashboard(farms[0].id);
      setDashboard(dash);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your farm.'));
    }
  }, []);

  useEffect(() => {
    // This rule's static check flags any call to an async function from an
    // effect regardless of real await gaps inside it — every setState call in
    // loadFarmAndDashboard happens after a network await, so there's no
    // synchronous-render concern here; this is the standard mount-time fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFarmAndDashboard();
  }, [loadFarmAndDashboard]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '16px 20px 0',
        }}
      >
        <button
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-2)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </div>

      {error && (
        <div style={{ maxWidth: 460, margin: '20px auto 0', padding: '0 20px' }}>
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
            {error}
          </div>
        </div>
      )}

      {farm === undefined && !error && <CenteredMessage text="Loading your farm…" />}

      {farm === null && <CreateFarmPrompt userName={user?.fullName} onCreated={loadFarmAndDashboard} />}

      {farm && dashboard && <DashboardView farmName={farm.name} dashboard={dashboard} />}

      {farm && !dashboard && !error && <CenteredMessage text="Loading your dashboard…" />}
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-2)', fontSize: 14, fontWeight: 600 }}>
      {text}
    </div>
  );
}

function CreateFarmPrompt({
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

function DashboardView({ farmName, dashboard }: { farmName: string; dashboard: Dashboard }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', paddingBottom: 40 }}>
      <div
        style={{
          background: `linear-gradient(175deg, var(--forest) 0%, var(--forest-2) 100%)`,
          color: 'white',
          padding: '18px 24px 30px',
          borderRadius: '0 0 30px 30px',
          marginTop: 8,
        }}
      >
        <div className="serif" style={{ fontSize: 23, fontStyle: 'italic' }}>
          {greeting}
        </div>
        <div style={{ marginTop: 3, fontSize: 13, color: 'rgba(255,255,255,0.62)', fontWeight: 500 }}>
          {farmName}
          {dashboard.farm.county ? ` · ${dashboard.farm.county}` : ''}
        </div>

        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.09em',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
            }}
          >
            Projected annual margin
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <div className="serif" style={{ fontSize: 48, lineHeight: 1 }}>
              €{eur.format(dashboard.projectedAnnualMarginEur)}
            </div>
            {dashboard.marginDeltaEur !== null && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(229,192,105,0.16)',
                  border: '1px solid rgba(229,192,105,0.4)',
                  color: 'var(--gold)',
                  padding: '5px 10px 5px 8px',
                  borderRadius: 100,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <ArrowUpIcon />
                €{eur.format(Math.abs(dashboard.marginDeltaEur))} vs last year
              </div>
            )}
          </div>
          {dashboard.marginDeltaEur === null && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: 600 }}>
              First year of data — no prior-year comparison yet
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Needs your attention</div>
          <div
            style={{
              background: 'var(--surface-2)',
              color: 'var(--ink-2)',
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 100,
            }}
          >
            {dashboard.alerts.length}
          </div>
        </div>

        {dashboard.alerts.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 20,
              textAlign: 'center',
              color: 'var(--ink-2)',
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            Nothing needs your attention right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dashboard.alerts.map((alert, i) => (
              <AlertRow key={i} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  red: 'var(--red)',
  amber: 'var(--amber)',
  green: 'var(--green-ok)',
};

const SEVERITY_TINT: Record<AlertSeverity, string> = {
  red: 'var(--red-tint)',
  amber: 'var(--amber-tint)',
  green: 'var(--green-tint)',
};

function AlertRow({ alert }: { alert: DashboardAlert }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: SEVERITY_DOT[alert.severity],
          flex: 'none',
        }}
      />
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: SEVERITY_TINT[alert.severity],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        <CategoryIcon category={alert.category} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{alert.title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1 }}>{alert.detail}</div>
      </div>
    </div>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H9M17 7v8" />
    </svg>
  );
}

function CategoryIcon({ category }: { category: AlertCategory }) {
  switch (category) {
    case 'housing':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v9h14v-9" />
          <path d="M9 19v-6h6v6" />
        </svg>
      );
    case 'soil':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-5.2-7-11a7 7 0 0114 0c0 5.8-7 11-7 11z" />
          <path d="M12 3v18" />
        </svg>
      );
    case 'weight':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M21 7v6h-6" />
        </svg>
      );
    case 'group_buy':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
  }
}
