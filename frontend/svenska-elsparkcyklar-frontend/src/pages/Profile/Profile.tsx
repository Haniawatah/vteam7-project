import React, { useEffect, useState } from 'react';
import { fetchProfile } from '../../services/user';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchProfile();
                setUser(data);
                setError(null);
            } catch (e: any) {
                setError(e?.message ?? 'Failed to fetch profile');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const handleyPayment = () => {
        navigate('/profile/payment');
    };

    const moneyAdd = () => {
        navigate('/profile/payments');
    };

    const monthly = () => {
        navigate('/profile/monthly');
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error">{error}</p>;

    if (!user) {
        return (
            <div className="profile-container">
                <div className="error">
                    Profile data is missing. Try logging out and logging in again.
                </div>
            </div>
        );
    }

    const sub = user.subscription ?? { status: 'inactive', nextBillingDate: null, monthlyFee: 0 };

    return (
  <div className="profile-container">
    <header className="profile-header">
      <div>
        <h1 style={{ margin: 0 }}>Profil</h1>
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>
          Inloggad som <strong>{user.email}</strong>
        </div>
      </div>

    </header>

    <section className="profile-grid">
      {/* Account info */}
      <div className="profile-card">
        <h2>Account</h2>
        <dl className="profile-dl">
          <div>
            <dt>Namn</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>E-post</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Användar-ID</dt>
            <dd style={{ fontFamily: 'monospace' }}>{user.id ?? '—'}</dd>
          </div>
          <div>
            <dt>Roll</dt>
            <dd style={{ fontFamily: 'monospace' }}>{user.role ?? '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="profile-card">

          <h2>Prenumeration</h2>
              <div className="card" style={{ marginBottom: 12 }}>
                {sub.status === 'inactive' || sub.status === 'stopping' ? (
                  <p>Expires: {sub.nextBillingDate ?? '—'}</p>
                ) : (
                  <>
                    <p>Status: {sub.status}</p>
                    <p>Next Billing: {sub.nextBillingDate ?? '—'}</p>
                  </>
                )}
              </div>



        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="button secondary" onClick={() => navigate('/rent')}>Hyr en scooter</button>
          <button className="button secondary" onClick={monthly} disabled={!user.enabled}>Subscribe</button>
        </div>
      </div>


      {/* Wallet / balance card */}
      <div className="profile-card">
        <h2>Plånbok</h2>
        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
          <p>${user.wallet}</p>
        </div>
        <div style={{ color: 'var(--muted)', marginTop: 6 }}>
          Din nuvarande balans som används för åkningar och avgifter.
        </div>

        <h2>Betalkort</h2>

        {user.last4 ? (
          <div className="card" style={{ marginBottom: 12 }}>
            <p>Card: {user.last4}</p>
            <p>Expires: {user.exp_date}</p>
            <p>Status: {user.enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 12 }}>
            <p>Ingen kortinformation</p>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="button" onClick={handleyPayment}>Change Card</button>
          <button className="button secondary" onClick={moneyAdd}>Add money</button>
        </div>
      </div>

      {/* Card info / subscription card */}

      {/* Ride summary */}
      <div className="profile-card">
        <h2>Åkningar (sammanfattning)</h2>
        {user.rides?.length > 0 ? (
          <>
            {user.rides.slice(0, 5).map((r: any) => (
              <div key={r.id} className="profile-list__row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    Scooter <span style={{ fontFamily: 'monospace' }}>{r.scooterId}</span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                    Start: {r.startTime ?? r.date} · Slut: {r.endTime}
                  </div>
                </div>
                <div className="profile-list__meta">
                  <span className="badge">{r.status ?? '—'}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ marginTop: 12, color: 'var(--muted)' }}>
            Inga åkningar ännu. Hyra en scooter för att komma igång.
          </div>
        )}
      </div>
    </section>
  </div>
);


};

export default Profile;