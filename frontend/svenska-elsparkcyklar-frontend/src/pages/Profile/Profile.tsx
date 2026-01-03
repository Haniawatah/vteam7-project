import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../../services/auth';
import type { Ride, User } from '../../types';

function coerceNumber(v: any, fallback = 0) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtMoneySek(amount: number) {
  try {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);
  } catch {
    return `${amount} SEK`;
  }
}

function fmtDate(v: unknown) {
  if (!v) return '—';
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
}

const Profile: React.FC = () => {
  const user = getStoredUser() as User | null;

  const normalized = useMemo(() => {
    const u = user ?? ({} as Partial<User>);
    const rides: Ride[] = Array.isArray((u as any).rides) ? ((u as any).rides as Ride[]) : [];
    const balance = coerceNumber((u as any).balance ?? (u as any).wallet ?? (u as any).credits ?? 0, 0);

    return {
      id: String((u as any).id ?? (u as any)._id ?? '—'),
      name: String((u as any).name ?? (u as any).username ?? '—'),
      email: String((u as any).email ?? '—'),
      role: ((u as any).role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
      balance,
      rides,
    };
  }, [user]);

  const stats = useMemo(() => {
    const total = normalized.rides.length;
    const active = normalized.rides.filter((r) => r.status === 'active').length;
    const ended = normalized.rides.filter((r) => r.status === 'ended').length;
    return { total, active, ended };
  }, [normalized.rides]);

  const recent = useMemo(() => {
    const items = [...normalized.rides];
    items.sort((a, b) => {
      const at = new Date(String(a.startTime ?? a.date ?? 0)).getTime();
      const bt = new Date(String(b.startTime ?? b.date ?? 0)).getTime();
      return bt - at;
    });
    return items.slice(0, 5);
  }, [normalized.rides]);

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div>
          <h1 style={{ margin: 0 }}>Profil</h1>
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>
            Inloggad som <strong>{normalized.email}</strong>
          </div>
        </div>

        <div className="profile-actions">
          <Link className="button secondary" to="/profile/payment">Betalning</Link>
          <Link className="button secondary" to="/profile/settings">Inställningar</Link>
          <Link className="button" to="/rent/history">Hyreshistorik</Link>
        </div>
      </header>

      <section className="profile-grid">
        <div className="profile-card">
          <h2>Account</h2>
          <dl className="profile-dl">
            <div>
              <dt>Namn</dt>
              <dd>{normalized.name}</dd>
            </div>
            <div>
              <dt>E-post</dt>
              <dd>{normalized.email}</dd>
            </div>
            <div>
              <dt>Användar-ID</dt>
              <dd style={{ fontFamily: 'monospace' }}>{normalized.id}</dd>
            </div>
            <div>
              <dt>Roll</dt>
              <dd>
                <span className={normalized.role === 'admin' ? 'badge badge--admin' : 'badge'}>
                  {normalized.role}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="profile-card">
          <h2>Plånbok</h2>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
            {fmtMoneySek(normalized.balance)}
          </div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>
            Din nuvarande balans som används för åkningar och avgifter.
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="button" to="/profile/payment">Uppdatera betalningsmetod</Link>
            <Link className="button secondary" to="/rent">Hyr en scooter</Link>
          </div>
        </div>

        <div className="profile-card">
          <h2>Åkningar (sammanfattning)</h2>
          <dl className="profile-dl">
            <div>
              <dt>Totalt</dt>
              <dd>{stats.total}</dd>
            </div>
            <div>
              <dt>Aktiva</dt>
              <dd>{stats.active}</dd>
            </div>
            <div>
              <dt>Avslutade</dt>
              <dd>{stats.ended}</dd>
            </div>
          </dl>

          {recent.length > 0 ? (
            <>
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>Senaste åkningarna</h3>
              <div className="profile-list">
                {recent.map((r) => (
                  <div key={r.id} className="profile-list__row">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>
                        Scooter <span style={{ fontFamily: 'monospace' }}>{r.scooterId}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                        Start: {fmtDate(r.startTime ?? r.date)} · Slut: {fmtDate(r.endTime)}
                      </div>
                    </div>
                    <div className="profile-list__meta">
                      <span className="badge">{r.status ?? '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ marginTop: 12, color: 'var(--muted)' }}>
              Inga åkningar ännu. <Link to="/rent">Hyra en scooter</Link> för att komma igång.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;