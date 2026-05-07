import React, { useEffect, useState } from 'react';
import { fetchLogsAdmin } from '../../../services/admin';

type LogRow = {
  id: string;
  user: string;
  scooterId: string;
  Date?: string;
  email?: string;
  price?: number;
  status?: string;
};

function normalizeLog(raw: any): LogRow {
  return {
    id: String(raw?.id ?? raw?._id ?? ''),
    user: String(raw?.user ?? raw?.userId ?? raw?.user_id ?? raw?.email ?? '—'),
    scooterId: String(raw?.scooterId ?? raw?.scooter_id ?? '—'),
    Date: raw?.startTime ?? raw?.date ?? raw?.createdAt ?? null,
    email: String(raw?.email ?? raw?.id ?? raw?._id ?? ''),
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
      console.log(data, "data")
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

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Start Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td >{r.id}</td>
                <td>{r.email}</td>
                <td>{fmt(r.Date)}</td>
                <td>{r.status}</td>
                <td style={{ textAlign: 'right' }}>{Number.isFinite(r.price as number) ? r.price : '—'}</td>
              </tr>
            ))}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 12 }}>
                  No logs found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
        API: <code>/v1/rides/history</code> (fallback <code>/v1/logs</code>)
      </div>
    </section>
  );
};

export default LogsPanel;