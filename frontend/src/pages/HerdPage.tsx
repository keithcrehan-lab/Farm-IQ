import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import {
  getHousingSummary,
  listLivestockGroups,
  upsertLivestockGroup,
  LIVESTOCK_CATEGORY_LABEL,
  SPECIES_BY_CATEGORY,
} from '../api/livestock';
import type { HousingSummary, LivestockCategory, LivestockGroup } from '../api/livestock';
import { createAnimal, getWeightAnalysis, listAnimals, listWeights, addWeight } from '../api/animals';
import type { Animal, AnimalSex, AnimalWeight, WeightAnalysis } from '../api/animals';
import { PageHeader } from '../components/PageHeader';
import { CenteredMessage, ErrorBanner } from '../components/Loading';
import { buttonStyle, inputStyle } from '../components/formStyles';
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui';
import { PlusIcon } from '../components/icons';

const CATTLE_CATEGORIES: LivestockCategory[] = ['cow', 'bull', 'calf', 'weanling', 'replacement_heifer', 'finishing'];
const SHEEP_CATEGORIES: LivestockCategory[] = ['ewe', 'ram', 'lamb', 'hogget'];

export function HerdPage() {
  const { farm } = useFarm();
  const [housing, setHousing] = useState<HousingSummary | null>(null);
  const [groups, setGroups] = useState<LivestockGroup[] | null>(null);
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!farm) return;
    try {
      const [h, g, a] = await Promise.all([
        getHousingSummary(farm.id),
        listLivestockGroups(farm.id),
        listAnimals(farm.id),
      ]);
      setHousing(h);
      setGroups(g);
      setAnimals(a);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your herd.'));
    }
  }, [farm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch, setState follows a network await
    load();
  }, [load]);

  if (!farm) return null;
  if (error) return <ErrorBanner message={error} />;
  if (!housing || !groups || !animals) return <CenteredMessage text="Loading your herd…" />;

  const headCountByCategory = new Map(groups.map((g) => [g.category, g.headCount]));

  async function saveCount(category: LivestockCategory, headCount: number) {
    if (!farm) return;
    const updated = await upsertLivestockGroup(farm.id, category, headCount);
    setGroups((prev) => {
      const others = (prev ?? []).filter((g) => g.category !== category);
      return [...others, updated];
    });
    setHousing(await getHousingSummary(farm.id));
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <PageHeader title="Livestock & Housing" subtitle={`${housing.projectedWinterStockHead} cattle · ${housing.totalCapacityHead} housing spaces`} />

      <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Winter housing</div>
            <Pill tone={housing.status === 'sufficient' ? 'good' : 'bad'}>
              {housing.status === 'sufficient' ? 'Sufficient' : 'Shortfall'}
            </Pill>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>{housing.message}</div>
          {housing.buildings.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {housing.buildings.map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-2)' }}>
                  <span>{b.name}</span>
                  <span>{b.capacityHead} spaces</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div>
          <SectionTitle>Cattle</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATTLE_CATEGORIES.map((cat) => (
              <CategoryRow key={cat} category={cat} headCount={headCountByCategory.get(cat) ?? 0} onSave={saveCount} />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Sheep</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SHEEP_CATEGORIES.map((cat) => (
              <CategoryRow key={cat} category={cat} headCount={headCountByCategory.get(cat) ?? 0} onSave={saveCount} />
            ))}
          </div>
        </div>

        <AnimalsSection farmId={farm.id} animals={animals} onAnimalsChange={setAnimals} />
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  headCount,
  onSave,
}: {
  category: LivestockCategory;
  headCount: number;
  onSave: (category: LivestockCategory, headCount: number) => Promise<void>;
}) {
  const [value, setValue] = useState(String(headCount));
  const [busy, setBusy] = useState(false);
  const dirty = value !== String(headCount);

  async function handleSave() {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return;
    setBusy(true);
    try {
      await onSave(category, n);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{LIVESTOCK_CATEGORY_LABEL[category]}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ ...inputStyle, width: 64, padding: '6px 8px', textAlign: 'right' }}
        />
        {dirty && (
          <button
            onClick={handleSave}
            disabled={busy}
            style={{ ...buttonStyle, marginTop: 0, padding: '6px 12px', fontSize: 12.5 }}
          >
            {busy ? '…' : 'Save'}
          </button>
        )}
      </div>
    </Card>
  );
}

function AnimalsSection({
  farmId,
  animals,
  onAnimalsChange,
}: {
  farmId: string;
  animals: Animal[];
  onAnimalsChange: (animals: Animal[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <SectionTitle
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            style={{ background: 'none', border: 'none', color: 'var(--forest)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}
          >
            <PlusIcon size={15} /> Add animal
          </button>
        }
      >
        Individually tracked animals
      </SectionTitle>

      {showForm && (
        <AddAnimalForm
          farmId={farmId}
          onCreated={(animal) => {
            onAnimalsChange([animal, ...animals]);
            setShowForm(false);
          }}
        />
      )}

      {animals.length === 0 ? (
        <EmptyState text="No individually tracked animals yet — headcounts above still work without this." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: showForm ? 10 : 0 }}>
          {animals.map((animal) => (
            <AnimalRow
              key={animal.id}
              farmId={farmId}
              animal={animal}
              expanded={expandedId === animal.id}
              onToggle={() => setExpandedId(expandedId === animal.id ? null : animal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddAnimalForm({ farmId, onCreated }: { farmId: string; onCreated: (animal: Animal) => void }) {
  const [tagNumber, setTagNumber] = useState('');
  const [category, setCategory] = useState<LivestockCategory>('weanling');
  const [sex, setSex] = useState<AnimalSex>('female');
  const [breed, setBreed] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const animal = await createAnimal(farmId, {
        tagNumber,
        category,
        sex,
        breed: breed || undefined,
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      });
      onCreated(animal);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not add this animal.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
        <input required placeholder="Tag number" value={tagNumber} onChange={(e) => setTagNumber(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={category} onChange={(e) => setCategory(e.target.value as LivestockCategory)} style={{ ...inputStyle, flex: 1 }}>
            {Object.entries(SPECIES_BY_CATEGORY).map(([cat]) => (
              <option key={cat} value={cat}>
                {LIVESTOCK_CATEGORY_LABEL[cat as LivestockCategory]}
              </option>
            ))}
          </select>
          <select value={sex} onChange={(e) => setSex(e.target.value as AnimalSex)} style={{ ...inputStyle, width: 110 }}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Breed (optional)" value={breed} onChange={(e) => setBreed(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input
            type="number"
            placeholder="Target kg"
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(e.target.value)}
            style={{ ...inputStyle, width: 110 }}
          />
        </div>
        {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600 }}>{error}</div>}
        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? 'Adding…' : 'Add animal'}
        </button>
      </Card>
    </form>
  );
}

function AnimalRow({
  farmId,
  animal,
  expanded,
  onToggle,
}: {
  farmId: string;
  animal: Animal;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [analysis, setAnalysis] = useState<WeightAnalysis | null>(null);
  const [weights, setWeights] = useState<AnimalWeight[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, w] = await Promise.all([getWeightAnalysis(farmId, animal.id), listWeights(farmId, animal.id)]);
      setAnalysis(a);
      setWeights(w);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load weight history.'));
    }
  }, [farmId, animal.id]);

  useEffect(() => {
    if (expanded && !analysis) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- user-triggered expand, setState follows a network await
      load();
    }
  }, [expanded, analysis, load]);

  async function handleAddWeight(e: FormEvent) {
    e.preventDefault();
    const kg = Number(newWeight);
    if (!Number.isFinite(kg) || kg <= 0) return;
    setBusy(true);
    try {
      await addWeight(farmId, animal.id, newDate, kg);
      setNewWeight('');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not record this weight.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div onClick={onToggle} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{animal.tagNumber}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>
            {LIVESTOCK_CATEGORY_LABEL[animal.category]}
            {animal.breed ? ` · ${animal.breed}` : ''}
          </div>
        </div>
        <Pill>{animal.sex}</Pill>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600 }}>{error}</div>}
          {!analysis && !error && <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Loading…</div>}

          {analysis && (
            <>
              {analysis.latestWeightKg === null ? (
                <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>No weights recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Stat label="Latest" value={`${analysis.latestWeightKg}kg`} />
                  {analysis.averageDailyGainKgPerDay !== null && (
                    <Stat label="ADG" value={`${analysis.averageDailyGainKgPerDay}kg/day`} />
                  )}
                  {analysis.targetWeightKg !== null && <Stat label="Target" value={`${analysis.targetWeightKg}kg`} />}
                  {analysis.progressPct !== null && <Stat label="Progress" value={`${analysis.progressPct}%`} />}
                </div>
              )}
              {analysis.isNearTarget && <Pill tone="good">Near target weight</Pill>}

              {weights && weights.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {weights.slice(-5).reverse().map((w) => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)' }}>
                      <span>{w.weighDate}</span>
                      <span>{w.weightKg}kg</span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddWeight} style={{ display: 'flex', gap: 6 }}>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 10px' }} />
                <input
                  type="number"
                  placeholder="kg"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  style={{ ...inputStyle, width: 80, padding: '8px 10px' }}
                />
                <button type="submit" disabled={busy} style={{ ...buttonStyle, marginTop: 0, padding: '8px 14px', fontSize: 12.5 }}>
                  {busy ? '…' : 'Add'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
