import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import { listFields } from '../api/fields';
import type { Field, LandUse, SoilType } from '../api/fields';
import { PageHeader } from '../components/PageHeader';
import { CenteredMessage, ErrorBanner } from '../components/Loading';
import { Card, EmptyState, Pill } from '../components/ui';
import { ChevronRightIcon } from '../components/icons';

const LAND_USE_LABEL: Record<LandUse, string> = {
  grazing: 'Grazing',
  silage: 'Silage',
  tillage: 'Tillage',
  rough_grazing: 'Rough grazing',
  other: 'Other',
};

const LAND_USE_COLOR: Record<LandUse, string> = {
  grazing: 'var(--forest)',
  silage: 'var(--gold-deep)',
  tillage: 'var(--red)',
  rough_grazing: 'var(--ink-3)',
  other: 'var(--ink-3)',
};

const SOIL_TYPE_LABEL: Record<SoilType, string> = {
  mineral: 'Mineral',
  peat: 'Peat',
  gley: 'Gley',
  unknown: 'Unknown',
};

export function FarmMapPage() {
  const { farm } = useFarm();
  const [fields, setFields] = useState<Field[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!farm) return;
    try {
      setFields(await listFields(farm.id));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your fields.'));
    }
  }, [farm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch, setState follows a network await
    load();
  }, [load]);

  if (!farm) return null;

  const totalHa = fields?.reduce((sum, f) => sum + Number(f.areaHa), 0) ?? 0;
  const maxHa = fields && fields.length > 0 ? Math.max(...fields.map((f) => Number(f.areaHa))) : 1;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <PageHeader
        title="Farm Map"
        subtitle={fields ? `${fields.length} field${fields.length === 1 ? '' : 's'} · ${totalHa.toFixed(1)} ha total` : undefined}
      />
      <div style={{ padding: '16px 24px 0' }}>
        {error && <ErrorBanner message={error} />}
        {!fields && !error && <CenteredMessage text="Loading your fields…" />}
        {fields && fields.length === 0 && (
          <EmptyState text="No fields recorded yet. Field boundaries are drawn from the backend API — add one there to see it here." />
        )}
        {fields && fields.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fields.map((field) => (
              <Link key={field.id} to={`/map/fields/${field.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{field.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1, fontWeight: 600 }}>
                        {Number(field.areaHa).toFixed(1)} ha · {SOIL_TYPE_LABEL[field.soilType]} soil
                      </div>
                    </div>
                    <Pill>{LAND_USE_LABEL[field.landUse]}</Pill>
                    <ChevronRightIcon size={16} color="var(--ink-3)" />
                  </div>
                  <div style={{ height: 6, borderRadius: 100, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(6, (Number(field.areaHa) / maxHa) * 100)}%`,
                        background: LAND_USE_COLOR[field.landUse],
                        borderRadius: 100,
                      }}
                    />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
