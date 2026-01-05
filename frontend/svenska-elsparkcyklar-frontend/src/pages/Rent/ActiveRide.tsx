import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getActiveRide, getRidePrice, endRide } from '../../services/rides';
import Loading from '../../components/Loading';

const ActiveRide = () => {
    const { rideId } = useParams();
    const [rideDetails, setRideDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState<number>(0);

    useEffect(() => {
        const fetchRideDetails = async () => {
            if (!rideId) return;
            try {
                const data = await getActiveRide(rideId);
                console.log(data, "data----------------------")
                setRideDetails(data);
            } catch (error) {
                console.error('Error fetching ride details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRideDetails();
    }, [rideId]);

    //Gör så vi uppdaterar priset vi ser så man vet hur mycket man betalar
    useEffect(() => {
        if (!rideId) return;

        const fetchPrice = async () => {
            try {
                const data = await getRidePrice(rideId);
                setPrice(data.price);
            } catch (error: any) {
                console.error('Error fetching price:', error);
            }
        };

        fetchPrice();
        //Refreshar priset varje 30 sekunder
        const interval = setInterval(fetchPrice, 30000);

        return () => clearInterval(interval);
    }, [rideId]);

    if (loading) return <Loading />;
    if (!rideDetails) return <div>No active ride found.</div>;

    return (
        <div>
            <h1>Active Ride</h1>
            <p>Scooter ID: {rideDetails.scooterId}</p>
            <p>Start Time: {new Date(rideDetails.start_time).toLocaleString()}</p>
            <p>Status: {rideDetails.status}</p>
            <p>
                Current Price: {price} SEK
            </p>
            {rideDetails.status === 'active' && (
                <button onClick={() => endRide(rideDetails.scooterId, rideDetails._id)}>End Ride</button>
            )}
        </div>
    );
};

export default ActiveRide;
