import { NavLink } from 'react-router-dom';
import { AssistantIcon, HerdIcon, HomeIcon, MapIcon, MoneyIcon } from './icons';

const TABS = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/map', label: 'Map', Icon: MapIcon, end: false },
  { to: '/herd', label: 'Herd', Icon: HerdIcon, end: false },
  { to: '/money', label: 'Money', Icon: MoneyIcon, end: false },
  { to: '/assistant', label: 'Assistant', Icon: AssistantIcon, end: false },
] as const;

export function BottomNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', width: '100%', maxWidth: 460 }}>
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '9px 0 8px',
              textDecoration: 'none',
            }}
          >
            {({ isActive }) => (
              <>
                <Icon size={21} color={isActive ? 'var(--forest)' : 'var(--ink-3)'} strokeWidth={isActive ? 2 : 1.7} />
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: isActive ? 'var(--forest)' : 'var(--ink-3)',
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
