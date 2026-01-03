import React, { useMemo, useState } from 'react';
import { useScooters } from '../../../hooks/useScooters';
import type { Scooter, ScooterStatus } from '../../../types';

const STATUS_ORDER: ScooterStatus[] = ['Available', 'InUse', 'Maintenance', 'Off'];

function nextStatus(current: ScooterStatus): ScooterStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

const ScootersPanel: React.FC = () => {
  // Keep existing auto-refresh behavior
  const { scooters, loading, error, refreshScooters } = useScooters(5000);

  // Simulated local change (no backend write)
  const [statusOverride, setStatusOverride] = useState<Record<string, ScooterStatus>>({});

  const rows: Scooter[] = useMemo(() => {
    return scooters.map((s) => ({
      ...s,
      status: statusOverride[s.id] ?? s.status,
    }));
  }, [scooters, statusOverride]);

  const onChangeStatus = (s: Scooter) => {
    const updated = nextStatus(statusOverride[s.id] ?? s.status);
    setStatusOverride((m) => ({ ...m, [s.id]: updated }));

    // If you later implement a PUT/PATCH endpoint, do it here then refresh:
    // await api.put(`/scooters/${s.id}`, { status: updated });
    // await refreshScooters();
  };

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Scooters</h1>

        <button onClick={() => void refreshScooters()} disabled={loading}>
          Refresh
        </button>

        {loading ? <span>Loading…</span> : null}
      </div>

      {error ? (
        <div style={{ marginBottom: 12 }}>
          <strong>Error:</strong> {error}{' '}
          <button onClick={() => void refreshScooters()}>
            Retry
          </button>
        </div>
      ) : null}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>City</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Battery</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Lat</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Lng</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td style={{ borderBottom: '1px solid #eee', padding: 8, fontFamily: 'monospace' }}>{s.id}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{s.city}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{s.status}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8, textAlign: 'right' }}>
                {Math.round(s.batteryLevel)}%
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8, textAlign: 'right' }}>
                {(s.location?.lat ?? 0).toFixed(6)}
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8, textAlign: 'right' }}>
                {(s.location?.lng ?? 0).toFixed(6)}
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                <button onClick={() => onChangeStatus(s)}>Change Status</button>
              </td>
            </tr>
          ))}

          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 12 }}>
                No scooters found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
};

export default ScootersPanel;