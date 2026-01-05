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
                console.log(data, "taw")
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
                    const startDate = ride.start_time ? new Date(ride.start_time) : null;
                    const startTime = new Date(ride.start_time).getTime();
                    const endTime = new Date(ride.end_time).getTime();
                    const durationInMs = endTime - startTime;
                    const duration = Math.ceil(durationInMs / 60000) ?? 0;
                    const cost = ride.price ?? 0;

                    return (
                        <li key={ride.id}>
                            <p>Date: {startDate ? startDate.toLocaleDateString() : '—'}</p>
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