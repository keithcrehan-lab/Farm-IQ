import { useCallback, useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import { getDashboard } from '../api/dashboard';
import type { AlertSeverity, Dashboard, DashboardAlert } from '../api/dashboard';
import { CategoryIcon, ArrowUpIcon } from '../components/icons';
import { CenteredMessage, ErrorBanner } from '../components/Loading';

const eur = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 });

export function DashboardPage() {
  const { farm } = useFarm();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!farm) return;
    try {
      const dash = await getDashboard(farm.id);
      setDashboard(dash);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your dashboard.'));
    }
  }, [farm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard mount-time fetch; every setState in loadDashboard follows a network await.
    loadDashboard();
  }, [loadDashboard]);

  if (!farm) return null;
  if (error) return <ErrorBanner message={error} />;
  if (!dashboard) return <CenteredMessage text="Loading your dashboard…" />;

  return <DashboardView farmName={farm.name} dashboard={dashboard} />;
}

function DashboardView({ farmName, dashboard }: { farmName: string; dashboard: Dashboard }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
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
                <ArrowUpIcon size={13} strokeWidth={2.4} />
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
