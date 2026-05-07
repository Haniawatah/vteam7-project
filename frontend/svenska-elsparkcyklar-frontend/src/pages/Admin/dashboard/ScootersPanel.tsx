import React, { useMemo, useState } from 'react';
import { useScooters } from '../../../hooks/useScooters';
import type { Scooter, ScooterStatus } from '../../../types';
import api from '../../../services/api';
import { adminChangesScooter } from '../../../services/admin';

const ScootersPanel: React.FC = () => {
  const { scooters, loading, error, refreshScooters } = useScooters(5000);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<ScooterStatus>('Available');
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => scooters, [scooters]);

  //Where we start the edit (the change status button)
  const startEdit = (s: Scooter) => {
    setEditingId(s.id);
    setEditingStatus(s.status);
  };

  //Cancel the "edit"
  const cancelEdit = () => {
    setEditingId(null);
    setEditingStatus('Available');
  };

  //THe thing where we edit it
  const saveEdit = async () => {
  if (!editingId) return;
    setBusy(true);
      try {
        const result = await adminChangesScooter(editingId, editingStatus);
        console.log('Backend', result);

        await refreshScooters();
        cancelEdit();
      } catch (err: any) {
        console.error(err);
        alert(err?.message ?? 'Failed to update scooter status');
      } finally {
        setBusy(false);
      }
    };

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Scooters</h1>

        <button onClick={() => void refreshScooters()} disabled={loading || busy}>
          Refresh
        </button>

        {loading && <span>Loading…</span>}
      </div>

      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 8 }}>City</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Battery</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Lat</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Lng</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((s) => {
            const isEditing = editingId === s.id;

            return (
              <tr key={s.id}>
                <td style={{ padding: 8, fontFamily: 'monospace' }}>{s.id}</td>
                <td style={{ padding: 8 }}>{s.city || '—'}</td>

                <td style={{ padding: 8 }}>
                  {isEditing ? (
                    <select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value as ScooterStatus) } disabled={busy}>
                        <option value='Available'>Available</option>
                        <option value='InUse'>InUse</option>
                        <option value='Maintenance'>Maintenance</option>
                        <option value='Charging'>Charging</option>
                        <option value='Off'>Off</option>
                    </select>
                  ) : (
                    <span>{s.status}</span>
                  )}
                </td>

                <td style={{ padding: 8, textAlign: 'right' }}>
                  {Math.round(s.batteryLevel)}%
                </td>

                <td style={{ padding: 8, textAlign: 'right' }}>
                  {(s.location?.lat ?? 0).toFixed(6)}
                </td>

                <td style={{ padding: 8, textAlign: 'right' }}>
                  {(s.location?.lng ?? 0).toFixed(6)}
                </td>

                <td style={{ padding: 8 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveEdit} disabled={busy}>
                        Save
                      </button>
                      <button className="secondary" onClick={cancelEdit} disabled={busy}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(s)} disabled={busy}>
                      Change status
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: 12 }}>
                No scooters found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
        Admin can override status even while a scooter is in use.
      </div>
    </section>
  );
};

export default ScootersPanel;
