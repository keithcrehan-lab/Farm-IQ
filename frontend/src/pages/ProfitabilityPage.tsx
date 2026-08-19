import { useCallback, useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import { getProfitability } from '../api/profitability';
import type { ProfitabilitySummary } from '../api/profitability';
import { PageHeader } from '../components/PageHeader';
import { CenteredMessage, ErrorBanner } from '../components/Loading';
import { Card, EmptyState, SectionTitle, eur } from '../components/ui';
import { ArrowUpIcon } from '../components/icons';

export function ProfitabilityPage() {
  const { farm } = useFarm();
  const [summary, setSummary] = useState<ProfitabilitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!farm) return;
    try {
      setSummary(await getProfitability(farm.id));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load profitability.'));
    }
  }, [farm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch, setState follows a network await
    load();
  }, [load]);

  if (!farm) return null;
  if (error) return <ErrorBanner message={error} />;
  if (!summary) return <CenteredMessage text="Crunching the numbers…" />;

  const marginPositive = summary.marginDeltaEur >= 0;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <PageHeader title="Profitability" subtitle={`${summary.year} margin, by enterprise and field`} back />

      <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            background: `linear-gradient(175deg, var(--forest) 0%, var(--forest-2) 100%)`,
            color: 'white',
            borderRadius: 20,
            padding: '20px 22px',
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>
            Net margin ({summary.year})
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <div className="serif" style={{ fontSize: 40 }}>
              €{eur.format(summary.totals.marginEur)}
            </div>
            {summary.previousYear.hasData && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(229,192,105,0.16)',
                  border: '1px solid rgba(229,192,105,0.4)',
                  color: 'var(--gold)',
                  padding: '4px 9px 4px 7px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {marginPositive ? <ArrowUpIcon size={12} strokeWidth={2.4} /> : <ArrowUpIcon size={12} strokeWidth={2.4} style={{ transform: 'rotate(180deg)' }} />}
                €{eur.format(Math.abs(summary.marginDeltaEur))} vs {summary.previousYear.year}
              </div>
            )}
          </div>
          {!summary.previousYear.hasData && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: 600 }}>
              First year of data — no prior-year comparison yet
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>Revenue</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>€{eur.format(summary.totals.revenueEur)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>Costs</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>€{eur.format(summary.totals.costsEur)}</div>
            </div>
          </div>
        </div>

        {summary.topMarginContributors.length > 0 && (
          <div>
            <SectionTitle>What moved the needle</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summary.topMarginContributors.map((c) => (
                <Card key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: c.deltaEur >= 0 ? 'var(--green-ok)' : 'var(--red)' }}>
                    {c.deltaEur >= 0 ? '+' : ''}€{eur.format(c.deltaEur)}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionTitle>By enterprise</SectionTitle>
          {summary.enterprises.length === 0 && summary.unassignedToEnterprise === null ? (
            <EmptyState text="No transactions recorded yet this year." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summary.enterprises.map((e) => (
                <Card key={e.enterpriseId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>
                      Revenue €{eur.format(e.revenueEur)} · Costs €{eur.format(e.costsEur)}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>€{eur.format(e.marginEur)}</div>
                </Card>
              ))}
              {summary.unassignedToEnterprise && (
                <Card style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)' }}>Unassigned</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>€{eur.format(summary.unassignedToEnterprise.marginEur)}</div>
                </Card>
              )}
            </div>
          )}
        </div>

        {summary.fields.length > 0 && (
          <div>
            <SectionTitle>By field</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summary.fields.map((f) => (
                <Card key={f.fieldId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{f.areaHa.toFixed(1)} ha</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>€{eur.format(f.marginEur)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>€{eur.format(f.marginPerHaEur)}/ha</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {summary.fieldsWithoutTransactions.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, paddingBottom: 12 }}>
            No transactions yet for: {summary.fieldsWithoutTransactions.map((f) => f.fieldName).join(', ')}.
          </div>
        )}
      </div>
    </div>
  );
}
