import React, { useEffect, useState } from 'react';
import { fetchInvoicesAdmin } from '../../../services/admin';

type LogRow = {
  id: string;
  user: string; 
  amount?: number;
  date?: string;
  paymentMethod?: string;
  status?: string;
};

function normalizeLog(raw: any): LogRow {
  return {
    id: String(raw._id ?? raw.id ?? ''),
    user: raw?.email ?? '—',
    amount: typeof raw?.money === 'number' ? raw?.money : Number(raw.money ?? NaN),
    date: raw?.date ?? null,
    paymentMethod: raw?.payment_method ?? '—',
    status: raw?.status ?? '—',
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
      const data = await fetchInvoicesAdmin();
      console.log(data, "data2")
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
              <th>Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'monospace' }}>{r.id}</td>
                <td>{r.user}</td>
                <td>{fmt(r.date)}</td>
                <td style={{ textAlign: 'right' }}>{Number.isFinite(r.amount ?? NaN) ? r.amount : '—'}</td>
                <td>{r.paymentMethod}</td>
                <td>{r.status}</td>
              </tr>
            ))}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12 }}>
                  No logs found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
        API: <code>/v1/invoices</code>
      </div>
    </section>
  );
};

export default LogsPanel;