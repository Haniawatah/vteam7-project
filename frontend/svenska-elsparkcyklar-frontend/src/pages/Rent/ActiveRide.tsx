import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getActiveRide } from '../../services/rides';
import Loading from '../../components/Loading';

const ActiveRide = () => {
    const { rideId } = useParams();
    const [rideDetails, setRideDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRideDetails = async () => {
            if (!rideId) return;
            try {
                const data = await getActiveRide(rideId);
                setRideDetails(data);
            } catch (error) {
                console.error('Error fetching ride details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRideDetails();
    }, [rideId]);

    if (loading) return <Loading />;
    if (!rideDetails) return <div>No active ride found.</div>;

    return (
        <div>
            <h1>Active Ride</h1>
            <p>Scooter ID: {rideDetails.scooterId}</p>
            <p>Start Time: {new Date(rideDetails.startTime).toLocaleString()}</p>
            <p>Status: {rideDetails.status}</p>
        </div>
    );
};

export default ActiveRide;