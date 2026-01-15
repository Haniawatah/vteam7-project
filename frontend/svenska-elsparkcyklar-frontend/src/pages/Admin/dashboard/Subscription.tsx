import React, { useEffect, useState } from 'react';
import { fetchSubscriptionsAdmin } from '../../../services/admin';

type LogRow = {
  id: string;
  user: string;
  cardId: string;
  Dates?: string;
  price?: number;
  type?: string;
};

function normalizeLog(raw: any): LogRow {
  return {
    id: String(raw?.id ?? raw?._id ?? ''),
    user: String(raw?.user ?? raw?.userId ?? raw?.user_id ?? raw?.email ?? '—'),
    cardId: String(raw?.cardId ?? raw?.card_id ?? '—'),
    Dates: raw?.date ?? raw?.DueDate ?? raw?.createdAt ?? null,
    price: typeof raw?.price === 'number' ? raw.amount : Number(raw?.amount ?? NaN),
    type: String(raw?.type ?? '—'),
  };
}

const SubscriptionPanel: React.FC = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubscriptionsAdmin();
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

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Card</th>
            <th>Date</th>
            <th>Type</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ fontFamily: 'monospace' }}>{r.id}</td>
              <td>{r.user}</td>
              <td style={{ fontFamily: 'monospace' }}>{r.cardId}</td>
              <td>{fmt(r.Dates)}</td>
              <td>{r.type}</td>
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

      <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
        API: <code>/v1/rides/history</code> (fallback <code>/v1/logs</code>)
      </div>
    </section>
  );
};

export default SubscriptionPanel;