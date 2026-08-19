import { useCallback, useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { extractErrorMessage } from '../api/client';
import {
  getFarmOfferView,
  joinGroupBuyOffer,
  leaveGroupBuyOffer,
  listGroupBuyOffers,
} from '../api/groupBuy';
import type { FarmOfferView, GroupBuyOffer } from '../api/groupBuy';
import { PageHeader } from '../components/PageHeader';
import { CenteredMessage, ErrorBanner } from '../components/Loading';
import { buttonStyle, inputStyle } from '../components/formStyles';
import { Card, EmptyState, Pill, eur } from '../components/ui';

/** Plain helper, not a component — keeps the impure Date.now() read out of OfferCard's render body. */
function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export function GroupBuyPage() {
  const { farm } = useFarm();
  const [offers, setOffers] = useState<GroupBuyOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOffers(await listGroupBuyOffers());
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load group-buy offers.'));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch, setState follows a network await
    load();
  }, [load]);

  if (!farm) return null;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <PageHeader title="Group Buy" subtitle="Local buying power on fertiliser" back />

      <div style={{ padding: '16px 24px 0' }}>
        {error && <ErrorBanner message={error} />}
        {!offers && !error && <CenteredMessage text="Loading offers…" />}
        {offers && offers.length === 0 && <EmptyState text="No group-buy offers available right now." />}

        {offers && offers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                farmId={farm.id}
                expanded={expandedId === offer.id}
                onToggle={() => setExpandedId(expandedId === offer.id ? null : offer.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  farmId,
  expanded,
  onToggle,
}: {
  offer: GroupBuyOffer;
  farmId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [view, setView] = useState<FarmOfferView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualTonnes, setManualTonnes] = useState('');
  const [busy, setBusy] = useState(false);

  const loadView = useCallback(async () => {
    try {
      setView(await getFarmOfferView(farmId, offer.id));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load this offer.'));
    }
  }, [farmId, offer.id]);

  useEffect(() => {
    if (expanded && !view) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- user-triggered expand, setState follows a network await
      loadView();
    }
  }, [expanded, view, loadView]);

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const quantity = view?.personalized ? undefined : Number(manualTonnes);
      if (quantity !== undefined && (!Number.isFinite(quantity) || quantity <= 0)) {
        setError('Enter how many tonnes you need to join.');
        return;
      }
      await joinGroupBuyOffer(farmId, offer.id, quantity);
      await loadView();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not join this offer.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    setError(null);
    try {
      await leaveGroupBuyOffer(farmId, offer.id);
      await loadView();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not leave this offer.'));
    } finally {
      setBusy(false);
    }
  }

  const daysLeft = daysUntil(offer.expiresAt);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div onClick={onToggle} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{offer.productName}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1, fontWeight: 600 }}>
            {offer.county ?? 'Nationwide'} · closes in {daysLeft}d
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>€{offer.negotiatedPricePerTonneEur}/t</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textDecoration: 'line-through' }}>
            €{offer.typicalPricePerTonneEur}/t
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600 }}>{error}</div>}
          {!view && !error && <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Loading…</div>}

          {view && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill tone={view.progress.thresholdMet ? 'good' : 'neutral'}>
                  {view.progress.totalCommittedTonnes}t / {view.progress.thresholdTonnes}t committed
                </Pill>
                <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>
                  {view.progress.participantCount} farm{view.progress.participantCount === 1 ? '' : 's'}
                </span>
              </div>

              {view.isExpired && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600 }}>This offer has expired.</div>}

              {view.personalized && (
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Your requirement: {view.personalized.requirementTonnes}t · save €
                  {eur.format(view.personalized.estimatedSavingEur)} vs typical price
                  {view.requirementSource === 'fertiliser_plan' && ' (from your fertiliser plan)'}
                </div>
              )}

              {!view.alreadyJoined && !view.personalized && !view.isExpired && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>
                    Tonnes required (no automatic figure for this product)
                  </span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={manualTonnes}
                    onChange={(e) => setManualTonnes(e.target.value)}
                    style={inputStyle}
                  />
                </label>
              )}

              {!view.isExpired &&
                (view.alreadyJoined ? (
                  <button onClick={handleLeave} disabled={busy} style={{ ...buttonStyle, background: 'var(--red)' }}>
                    {busy ? 'Leaving…' : `Leave offer (joined for ${view.joinedQuantityTonnes}t)`}
                  </button>
                ) : (
                  <button onClick={handleJoin} disabled={busy} style={buttonStyle}>
                    {busy ? 'Joining…' : 'Join this offer'}
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
