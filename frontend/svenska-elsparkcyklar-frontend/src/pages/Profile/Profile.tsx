import React, { useEffect, useState } from 'react';
import { fetchProfile } from '../../services/user';
import { getUserActiveRide } from '../../services/rides';
import { useNavigate } from 'react-router-dom';




const Profile: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeRide, setActiveRide] = useState<any>(null);
    const [rideHistory, setRideHistory] = useState(false);
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

    useEffect(() => {
        const loadActiveRide = async () => {
            try {
                const data = await getUserActiveRide();
                console.log("nywa dawd ", data)
                if (data.success === true) {
                    const ride = data.ride._id ?? data.ride.id;
                    setActiveRide(ride);
                    setRideHistory(true)
                } else {
                  setRideHistory(false)
                }
            } catch (err) {
                console.log('No active ride', err);
            }
        };
        void loadActiveRide();
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

    const ActiveRide = () => {
        navigate(`/rent/active/${activeRide}`);
    };

    const RideHistory = () => {
        navigate('/rent/history');
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


      {/* Walet / balance card */}
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
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="button" disabled={!rideHistory} onClick={ActiveRide}>Aktiv Ride</button>
            <button className="button secondary" onClick={RideHistory}>Ride History</button>
          </div>
      </div>
    </section>
  </div>
);


};

export default Profile;