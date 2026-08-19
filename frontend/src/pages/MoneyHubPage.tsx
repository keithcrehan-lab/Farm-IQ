import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui';
import { ChevronRightIcon, GroupBuyIcon, MoneyIcon, SoilIcon } from '../components/icons';

const LINKS = [
  {
    to: '/money/fertiliser-plan',
    title: 'Fertiliser Plan',
    detail: 'What to buy, and what it costs, from your soil tests',
    Icon: SoilIcon,
  },
  {
    to: '/money/group-buy',
    title: 'Group Buy',
    detail: 'Join local buying power to cut fertiliser costs',
    Icon: GroupBuyIcon,
  },
  {
    to: '/money/profitability',
    title: 'Profitability',
    detail: 'Margin by enterprise and by field',
    Icon: MoneyIcon,
  },
] as const;

export function MoneyHubPage() {
  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <PageHeader title="Money" subtitle="Costs, savings and margin in one place" />
      <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LINKS.map(({ to, title, detail, Icon }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'var(--green-tint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <Icon size={20} color="var(--forest)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1, fontWeight: 600 }}>{detail}</div>
              </div>
              <ChevronRightIcon size={16} color="var(--ink-3)" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
