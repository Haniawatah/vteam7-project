import React from 'react';
import { useSearchParams } from 'react-router-dom';

import ScootersPanel from './dashboard/ScootersPanel';
import UsersPanel from './dashboard/UsersPanel';
import StationsPanel from './dashboard/StationsPanel';
import LogsPanel from './dashboard/LogsPanel';
import SubscriptionPanel from './dashboard/Subscription';
import ChargingPanel from './dashboard/ChargingPanel';
import InvoicesPanel from './dashboard/InvoicesPanel';

type TabKey = 'scooters' | 'users' | 'stations' | 'invoices' | 'logs' | 'subscriptionLogs' | 'charging';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'scooters', label: 'Scooters' },
  { key: 'users', label: 'Users' },
  { key: 'stations', label: 'Stations' },
  { key: 'charging', label: 'charging' },
  { key: 'invoices', label: 'invoices' },
  { key: 'logs', label: 'Logs' },
  { key: 'subscriptionLogs', label: 'subscriptionLogs' },
];

function coerceTab(value: string | null): TabKey {
  switch (value) {
    case 'users':
    case 'stations':
    case 'charging':
    case 'invoices':
    case 'logs':
    case 'subscriptionLogs':
    case 'scooters':
      return value;
    default:
      return 'scooters';
  }
}

const Dashboard: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const active = coerceTab(params.get('tab'));

  const setTab = (tab: TabKey) => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    setParams(next, { replace: true });
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-dashboard__aside">
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Admin</div>

        <nav style={{ display: 'grid', gap: 8 }}>
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={isActive ? '' : 'secondary'}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  display: 'inline-flex',
                  gap: 8,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12, lineHeight: 1.4 }}>
          Tip: You can deep-link tabs via <code>?tab=users</code>.
        </div>
      </aside>

      <main className="admin-dashboard__main">
        {active === 'scooters' ? <ScootersPanel /> : null}
        {active === 'users' ? <UsersPanel /> : null}
        {active === 'stations' ? <StationsPanel /> : null}
        {active === 'charging' ? <ChargingPanel /> : null}
        {active === 'invoices' ? <InvoicesPanel /> : null}
        {active === 'logs' ? <LogsPanel /> : null}
        {active === 'subscriptionLogs' ? <SubscriptionPanel /> : null}
      </main>
    </div>
  );
};

export default Dashboard;