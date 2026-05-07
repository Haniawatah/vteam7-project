import React, { useEffect, useState } from 'react';
import { fetchParkingStationsAdmin } from '../../../services/admin';
import { useNavigate } from 'react-router-dom';
import { unParkScooter } from '../../../services/scooters';

type StationRow = {
  id: string;
  city: string;
  capacity: number;
  elsparkcyklar: string[];
};

function normalizeStation(raw: any): StationRow {
  const city = String(raw?.city ?? raw?.stad ?? raw?.cityName ?? raw?.namn ?? raw?.name ?? '—');
  const elsparkcyklar = Array.isArray(raw?.elsparkcyklar) ? raw.elsparkcyklar : [];
  const capacity = elsparkcyklar.length;

  return {
    id: String(raw?.id ?? raw?._id ?? `${city}:${elsparkcyklar}`),
    city,
    capacity,
    elsparkcyklar,
  };
}

const StationsPanel: React.FC = () => {
  const [rows, setRows] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchParkingStationsAdmin();
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

  const toggleExpand = (stationId: string) => {
    setExpandedStations((prev) => {
      const copy = new Set(prev);
      if (copy.has(stationId)) copy.delete(stationId);
      else copy.add(stationId);
      return copy;
    });
  };

  const addBike = (stationId: string) => {
    console.log("hejsan", stationId)
    navigate(`parking/add/${stationId}`);
  };

  const removeBike = (scooterId: string, stationId: string) => {
    unParkScooter(scooterId, stationId);
    refresh()
  };

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Stations</h1>
        <button onClick={() => void refresh()} disabled={loading}>
          Refresh
        </button>
        {loading ? <span>Loading…</span> : null}
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>City</th>
            <th style={{ textAlign: 'right' }}>Capacity</th>
            <th>Actions</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((s) => (
            <React.Fragment key={s.id}>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td>{s.city}</td>
                <td style={{ textAlign: 'right' }}>{s.capacity}</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => addBike(s.id)}
                  >
                    Add Bike
                  </button>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => toggleExpand(s.id)}>
                    {expandedStations.has(s.id) ? 'Hide Bikes' : 'Show Bikes'}
                  </button>
                </td>
              </tr>

                  {expandedStations.has(s.id) &&
                    s.elsparkcyklar.map((scooterId) => (
                      <tr key={scooterId} style={{ background: '#f9f9f9' }}>
                        <td>{scooterId}</td>
                        <td></td>
                        <td></td>

                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => removeBike(scooterId, s.id)}>
                            Remove scooter
                          </button>
                        </td>
                      </tr>
                    ))}
            </React.Fragment>
          ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12 }}>
                No stations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
        API: <code>/v1/stations</code> (fallback <code>/v1/cities</code>)
      </div>
    </section>
  );
};


export default StationsPanel;
