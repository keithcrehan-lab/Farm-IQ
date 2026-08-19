import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FarmProvider, useFarm } from '../context/FarmContext';
import { CreateFarmPrompt } from './CreateFarmPrompt';
import { CenteredMessage, ErrorBanner } from './Loading';
import { BottomNav } from './BottomNav';

/** Gates every screen behind "does this user have a farm yet", then supplies FarmContext + the bottom nav. */
export function AppShell() {
  return (
    <FarmProvider>
      <AppShellInner />
    </FarmProvider>
  );
}

function AppShellInner() {
  const { user, logout } = useAuth();
  const { farm, error, refresh } = useFarm();

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
          <ErrorBanner message={error} />
        </div>
      )}

      {farm === undefined && !error && <CenteredMessage text="Loading your farm…" />}

      {farm === null && (
        <CreateFarmPrompt userName={user?.fullName} onCreated={refresh} />
      )}

      {farm && (
        <div style={{ paddingBottom: 76 }}>
          <Outlet />
        </div>
      )}

      {farm && <BottomNav />}
    </div>
  );
}
