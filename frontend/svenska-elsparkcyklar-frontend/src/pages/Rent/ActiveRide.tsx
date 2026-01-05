import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getActiveRide, getRidePrice, endRide } from '../../services/rides';
import Loading from '../../components/Loading';
import AvailableScooterMap from '../../components/Map/availableScooterMap';

const ActiveRide = () => {
    const { rideId } = useParams();
    const [rideDetails, setRideDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState<number>(0);
    const navigate = useNavigate();

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
    //Sen när vi har "bekräftat en order så visas priset vi spenderade"
    useEffect(() => {
        if (!rideId) return;

        const fetchPrice = async () => {
            try {
                const data = await getRidePrice(rideId);

                if (rideDetails?.status === 'Complete') {
                    setPrice(rideDetails.price);
                } else {
                    setPrice(data.price);
                }
            } catch (error: any) {
                console.error('Error fetching price:', error);
            }
        };

        fetchPrice();
        //Refreshar priset varje 30 sekunder
        const interval = setInterval(fetchPrice, 30000);

        return () => clearInterval(interval);
    }, [rideId]);

    const endRideButton = async () => {
        try {
            let complete = await endRide(rideDetails.scooterId, rideDetails._id)
            if (complete) {
                navigate('/rent/history');
            }
            } catch (error: any) {
                console.error('Error fetching price:', error);
            }
    };

    if (loading) return <Loading />;
    if (!rideDetails) return <div>No active ride found.</div>;

    return (
        <div className="container">
            <div className="card">
                <h1>Active Ride</h1>

                    <p>Scooter ID: {rideDetails.scooterId}</p>
                    <p>Start Time: {new Date(rideDetails.start_time).toLocaleString()}</p>
                    <p>Status: {rideDetails.status}</p>
                    <p>
                        Price: {price} SEK
                    </p>
                    {rideDetails.status === 'active' && (
                        <button onClick={endRideButton}>
                            End Ride</button>
                    )}

                <div style={{ height: 420 }}>
                <AvailableScooterMap />
                </div>
            </div>
        </div>


    );
};

export default ActiveRide;
