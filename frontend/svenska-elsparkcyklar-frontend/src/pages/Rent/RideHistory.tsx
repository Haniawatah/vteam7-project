import React, { useEffect, useState } from 'react';
import { getRideHistory } from '../../services/rides';
import { useNavigate } from 'react-router-dom';


const RideHistory: React.FC = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Scooter ID</th>
                        <th >Duration (min)</th>
                        <th>Status</th>
                        <th>Cost ($)</th>
                    </tr>
                </thead>

                <tbody>
                    {rides
                        //Filtrera så vi bara visar Färdiga logs eftersom den som är aktiv kan synas på aktiv
                        .filter(ride => ride.status !== 'active')
                        .map((ride) => {
                            const startDate = ride.start_time ? new Date(ride.start_time) : null;

                            let duration = 0;
                            if (ride.end_time) {
                                const startTime = new Date(ride.start_time).getTime();
                                const endTime = new Date(ride.end_time).getTime();
                                duration = Math.ceil((endTime - startTime) / 60000);
                            }

                            const cost = ride.price ?? 0;

                            return (
                            <tr key={ride.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}>{startDate ? startDate.toLocaleDateString() : '—'}</td>
                                <td>
                                    <a href={`/ride/history/${ride.id}`}
                                        style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
                                        {ride.scooterId}
                                    </a>
                                </td>
                                <td style={{ padding: '8px' }}>{duration} min</td>
                                <td style={{ padding: '8px' }}>{ride.status}</td>
                                <td style={{ padding: '8px' }}>${cost.toFixed(2)}</td>
                            </tr>
                            );
                        })}
                    </tbody>
            </table>
        </div>
    );
};







export default RideHistory;