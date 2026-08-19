import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { listFarms } from '../api/farms';
import type { Farm } from '../api/farms';
import { extractErrorMessage } from '../api/client';

interface FarmContextValue {
  /** undefined = still checking, null = signed-in user has no farm yet. */
  farm: Farm | null | undefined;
  error: string | null;
  /** Re-fetches the farm list — call after creating a farm, or to recover from a load error. */
  refresh: () => Promise<void>;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState<Farm | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const farms = await listFarms();
      setFarm(farms.length > 0 ? farms[0] : null);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your farm.'));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see AuthContext/DashboardPage: this is the standard mount-time fetch, every setState here follows a network await.
    refresh();
  }, [refresh]);

  return <FarmContext.Provider value={{ farm, error, refresh }}>{children}</FarmContext.Provider>;
}

export function useFarm(): FarmContextValue {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within a FarmProvider');
  return ctx;
}
