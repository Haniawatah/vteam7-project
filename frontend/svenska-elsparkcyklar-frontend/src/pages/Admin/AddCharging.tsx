import React, { useEffect, useState } from 'react';
import { fetchScootersSpecificCity } from '../../services/scooters';
import { chargingScooter } from '../../services/scooters';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';



const ChargeScooter: React.FC = () => {
	const { stationId } = useParams<{ stationId: string }>();
  const [bikes, setBikes] = useState<string[]>([]);
  const [selectedBike, setSelectedBike] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

  useEffect(() => {
    const loadBikes = async () => {
      try {
        setLoading(true);
        const data = await fetchScootersSpecificCity(stationId);
        const bikeList = data.map((b: any) => (b.id));
        setBikes(bikeList);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch bikes');
      } finally {
        setLoading(false);
      }
    };

    void loadBikes();
  }, []);

  const handleAdd = () => {
    if (!selectedBike) return;
		console.log(selectedBike)
    chargingScooter(selectedBike, stationId);
    setSelectedBike('');
		navigate(`/admin`);
  };

  if (loading) return <span>Loading bikes…</span>;
  if (error) return <span style={{ color: 'red' }}>{error}</span>;

  return (
    <div className="profile-card">
      <label>
        Select a bike:
        <select
          value={selectedBike}
          onChange={(e) => setSelectedBike(e.target.value)}
        >
          <option value="">-- Select a bike --</option>
          {bikes.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <button onClick={handleAdd} disabled={!selectedBike} style={{ marginLeft: 8 }}>
        Add Bike
      </button>
    </div>
  );
};

export default ChargeScooter;
