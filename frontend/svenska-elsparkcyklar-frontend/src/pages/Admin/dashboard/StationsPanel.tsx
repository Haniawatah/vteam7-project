import React, { useEffect, useState } from 'react';
import { fetchStationsAdmin } from '../../../services/admin';

type StationRow = {
  id: string;
  city: string;
  type: 'Charging' | 'Parking' | 'Unknown';
  capacity: number;
  locationText: string;
};

function coerceNumber(v: any, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatLocation(raw: any): string {
  // suppor ts: {lat,lng}, [lat,lng], GeoJSON {coordinates:[lng,lat]}
  if (raw && typeof raw === 'object' && typeof raw.lat === 'number' && typeof raw.lng === 'number') {
    return `${raw.lat.toFixed(6)}, ${raw.lng.toFixed(6)}`;
  }
  if (Array.isArray(raw) && raw.length >= 2) {
    const lat = coerceNumber(raw[0]);
    const lng = coerceNumber(raw[1]);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  if (raw && typeof raw === 'object' && Array.isArray(raw.coordinates) && raw.coordinates.length >= 2) {
    const lng = coerceNumber(raw.coordinates[0]);
    const lat = coerceNumber(raw.coordinates[1]);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  return '—';
}

function normalizeStation(raw: any): StationRow {
  const typeRaw = String(raw?.type ?? raw?.stationType ?? raw?.kind ?? '').toLowerCase();
  const type =
    typeRaw.includes('charge') || typeRaw.includes('ladd') ? 'Charging' :
    typeRaw.includes('park') ? 'Parking' :
    'Unknown';

  const city = String(raw?.city ?? raw?.stad ?? raw?.cityName ?? raw?.namn ?? raw?.name ?? '—');

  const capacity =
    coerceNumber(raw?.capacity ?? raw?.slots ?? raw?.maxScooters ?? raw?.elsparkcyklar?.capacity ?? 0, 0);

  const locationText = formatLocation(raw?.location ?? raw?.position ?? raw?.zone?.center);

  return {
    id: String(raw?.id ?? raw?._id ?? `${city}:${type}:${locationText}`),
    city,
    type,
    capacity,
    locationText,
  };
}

const StationsPanel: React.FC = () => {
  const [rows, setRows] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStationsAdmin();
      const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
      setRows(list.map(normalizeStation).filter((s) => s.id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Stations</h1>
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
            <th>City</th>
            <th>Type</th>
            <th style={{ textAlign: 'right' }}>Capacity</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>{s.city}</td>
              <td>{s.type}</td>
              <td style={{ textAlign: 'right' }}>{s.capacity}</td>
              <td style={{ fontFamily: 'monospace' }}>{s.locationText}</td>
            </tr>
          ))}

          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 12 }}>
                No stations found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
        API: <code>/v1/stations</code> (fallback <code>/v1/cities</code>)
      </div>
    </section>
  );
};

export default StationsPanel;