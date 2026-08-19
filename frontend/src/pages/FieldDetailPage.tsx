import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import { getField } from '../api/fields';
import type { Field } from '../api/fields';
import { analyzeSoilTest, listSoilTests } from '../api/soilTests';
import type { SoilAnalysisResult, SoilTest } from '../api/soilTests';
import { PageHeader } from '../components/PageHeader';
import { CenteredMessage, ErrorBanner } from '../components/Loading';
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui';

const STATUS_TONE = { low: 'bad', target: 'good', high: 'warn' } as const;

export function FieldDetailPage() {
  const { farm } = useFarm();
  const { fieldId } = useParams<{ fieldId: string }>();
  const [field, setField] = useState<Field | null>(null);
  const [tests, setTests] = useState<SoilTest[] | null>(null);
  const [analysis, setAnalysis] = useState<SoilAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!farm || !fieldId) return;
    try {
      const [f, t] = await Promise.all([getField(farm.id, fieldId), listSoilTests(farm.id, fieldId)]);
      setField(f);
      setTests(t);
      if (t.length > 0) {
        setAnalysis(await analyzeSoilTest(farm.id, fieldId, t[0].id));
      }
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load this field.'));
    }
  }, [farm, fieldId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch, setState follows a network await
    load();
  }, [load]);

  if (!farm) return null;
  if (error) return <ErrorBanner message={error} />;
  if (!field || !tests) return <CenteredMessage text="Loading field…" />;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <PageHeader
        title={field.name}
        subtitle={`${Number(field.areaHa).toFixed(1)} ha · ${field.landUse.replace('_', ' ')}`}
        back
      />

      <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {tests.length === 0 && (
          <EmptyState text="No soil tests recorded for this field yet — recommendations appear once a test is logged." />
        )}

        {analysis && (
          <div>
            <SectionTitle>Soil status</SectionTitle>
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatusRow label="pH" value={tests[0].ph.toFixed(1)} detail={`target ${analysis.phTarget.toFixed(1)}`} />
              <StatusRow label="Phosphorus (P)" value={`Index ${tests[0].pIndex}`} tone={STATUS_TONE[analysis.pStatus]} status={analysis.pStatus} />
              <StatusRow label="Potassium (K)" value={`Index ${tests[0].kIndex}`} tone={STATUS_TONE[analysis.kStatus]} status={analysis.kStatus} />
            </Card>
          </div>
        )}

        {analysis && analysis.recommendations.length > 0 && (
          <div>
            <SectionTitle>Recommendations</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analysis.recommendations.map((rec) => (
                <Card key={rec.nutrient} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, textTransform: 'capitalize' }}>{rec.nutrient}</div>
                    <Pill tone="bad">action needed</Pill>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{rec.whatsWrong}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{rec.whatToDo}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                    <span>Est. cost €{rec.estimatedCostEur.toLocaleString('en-IE')}</span>
                    <span>Est. benefit €{rec.estimatedBenefitEur.toLocaleString('en-IE')}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {analysis && analysis.recommendations.length === 0 && tests.length > 0 && (
          <EmptyState text="This field's soil is at target — no fertiliser action recommended right now." />
        )}

        {tests.length > 0 && (
          <div>
            <SectionTitle>Test history</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tests.map((t) => (
                <Card key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.sampleDate}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                    pH {t.ph.toFixed(1)} · P{t.pIndex} · K{t.kIndex}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  detail,
  tone,
  status,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'good' | 'bad' | 'warn';
  status?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
        {detail && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{detail}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{value}</span>
        {tone && <Pill tone={tone}>{status}</Pill>}
      </div>
    </div>
  );
}
