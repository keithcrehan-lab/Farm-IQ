import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import { getFertiliserPlan } from '../api/fertiliserPlan';
import type { FertiliserPlan } from '../api/fertiliserPlan';
import { PageHeader } from '../components/PageHeader';
import { CenteredMessage, ErrorBanner } from '../components/Loading';
import { Card, EmptyState, SectionTitle, eur } from '../components/ui';

const CATEGORY_LABEL: Record<string, string> = {
  lime: 'Lime',
  phosphorus: 'Phosphorus',
  potassium: 'Potassium',
  nitrogen: 'Nitrogen',
};

export function FertiliserPlanPage() {
  const { farm } = useFarm();
  const [plan, setPlan] = useState<FertiliserPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!farm) return;
    try {
      setPlan(await getFertiliserPlan(farm.id));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your fertiliser plan.'));
    }
  }, [farm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch, setState follows a network await
    load();
  }, [load]);

  if (!farm) return null;
  if (error) return <ErrorBanner message={error} />;
  if (!plan) return <CenteredMessage text="Building your fertiliser plan…" />;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <PageHeader title="Fertiliser Plan" subtitle="Lime, phosphorus & potassium, from your soil tests" back />

      <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            background: `linear-gradient(175deg, var(--forest) 0%, var(--forest-2) 100%)`,
            color: 'white',
            borderRadius: 20,
            padding: '18px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>
              Estimated cost
            </div>
            <div className="serif" style={{ fontSize: 30, marginTop: 4 }}>
              €{eur.format(plan.totalEstimatedCostEur)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>
              Estimated benefit
            </div>
            <div className="serif" style={{ fontSize: 30, marginTop: 4, color: 'var(--gold)' }}>
              €{eur.format(plan.totalEstimatedBenefitEur)}
            </div>
          </div>
        </div>

        {plan.products.length === 0 ? (
          <EmptyState text="No purchasing requirement right now — every tested field is at or above target for lime, phosphorus and potassium." />
        ) : (
          <div>
            <SectionTitle>What to buy</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.products.map((p) => (
                <Card key={p.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{p.productName}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                      {CATEGORY_LABEL[p.category] ?? p.category} · {p.quantityTonnes}t @ €{p.pricePerTonneEur}/t
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>€{eur.format(p.estimatedCostEur)}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {plan.fieldBreakdown.length > 0 && (
          <div>
            <SectionTitle>By field</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.fieldBreakdown.map((entry) => (
                <Link key={entry.fieldId} to={`/map/fields/${entry.fieldId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Card>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{entry.fieldName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2, fontWeight: 600 }}>
                      {entry.areaHa.toFixed(1)} ha · tested {entry.soilTestDate}
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 6 }}>
                      {entry.recommendations.map((r) => r.nutrient).join(', ')}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {plan.fieldsMissingSoilTests.length > 0 && (
          <div>
            <SectionTitle>Missing soil tests</SectionTitle>
            <Card style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 600 }}>
              {plan.fieldsMissingSoilTests.map((f) => f.fieldName).join(', ')} — no recommendation possible without
              a soil test.
            </Card>
          </div>
        )}

        {plan.notes.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, paddingBottom: 12 }}>
            {plan.notes.map((n, i) => (
              <p key={i} style={{ margin: '0 0 6px' }}>
                {n}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
