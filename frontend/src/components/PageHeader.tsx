import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './icons';

export function PageHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  /** Show a back button that navigates to history[-1]. */
  back?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px 24px 4px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            width: 34,
            height: 34,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink)',
            marginTop: 2,
          }}
        >
          <ArrowLeftIcon size={17} />
        </button>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 26 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2, fontWeight: 600 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
