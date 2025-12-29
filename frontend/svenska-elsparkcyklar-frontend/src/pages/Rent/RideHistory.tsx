import React, { useEffect, useState } from 'react';
import { getRideHistory } from '../../services/rides';
import { Ride } from '../../types';

const RideHistory: React.FC = () => {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRideHistory = async () => {
            try {
                const data = await getRideHistory();
                setRides(data);
            } catch (err) {
                setError('Failed to fetch ride history');
            } finally {
                setLoading(false);
            }
        };

        fetchRideHistory();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Ride History</h1>
            <ul>
                {rides.map((ride) => {
                    const date = ride.date ? new Date(ride.date) : null;
                    const duration = ride.duration ?? 0;
                    const cost = ride.cost ?? 0;

                    return (
                        <li key={ride.id}>
                            <p>Date: {date ? date.toLocaleDateString() : '—'}</p>
                            <p>Scooter ID: {ride.scooterId}</p>
                            <p>Duration: {duration} minutes</p>
                            <p>Cost: ${cost.toFixed(2)}</p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default RideHistory;