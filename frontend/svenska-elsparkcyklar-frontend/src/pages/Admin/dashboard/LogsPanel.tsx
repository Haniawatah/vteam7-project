import React, { useEffect, useState } from 'react';
import { fetchLogsAdmin } from '../../../services/admin';

type LogRow = {
  id: string;
  user: string;
  scooterId: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  status?: string;
};

function normalizeLog(raw: any): LogRow {
  return {
    id: String(raw?.id ?? raw?._id ?? ''),
    user: String(raw?.user ?? raw?.userId ?? raw?.user_id ?? raw?.email ?? '—'),
    scooterId: String(raw?.scooterId ?? raw?.scooter_id ?? '—'),
    startTime: raw?.startTime ?? raw?.start_time ?? raw?.createdAt ?? null,
    endTime: raw?.endTime ?? raw?.end_time ?? raw?.endedAt ?? null,
    price: typeof raw?.price === 'number' ? raw.price : Number(raw?.price ?? NaN),
    status: String(raw?.status ?? '—'),
  };
}

const LogsPanel: React.FC = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLogsAdmin();
      const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
      setRows(list.map(normalizeLog).filter((l) => l.id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const fmt = (v?: any) => (v ? new Date(v).toLocaleString() : '—');

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Logs</h1>
        <button onClick={() => void refresh()} disabled={loading}>
          Refresh
        </button>
        {loading ? <span>Loading…</span> : null}
      </div>

      {error ? (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Scooter</th>
            <th>Start</th>
            <th>End</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ fontFamily: 'monospace' }}>{r.id}</td>
              <td>{r.user}</td>
              <td style={{ fontFamily: 'monospace' }}>{r.scooterId}</td>
              <td>{fmt(r.startTime)}</td>
              <td>{fmt(r.endTime)}</td>
              <td style={{ textAlign: 'right' }}>{Number.isFinite(r.price as number) ? r.price : '—'}</td>
              <td>{r.status}</td>
            </tr>
          ))}

          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 12 }}>
                No logs found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
        API: <code>/v1/rides/history</code> (fallback <code>/v1/logs</code>)
      </div>
    </section>
  );
};

export default LogsPanel;