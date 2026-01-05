import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScooterMap from '../../components/Map/ScooterMap';
import { rentScooter } from '../../services/scooters';
import './RentScooter.css';

const RentScooter = () => {
    const [scooterId, setScooterId] = useState('');
    const [isRenting, setIsRenting] = useState(false);
    const navigate = useNavigate();

    const handleRentScooter = async () => {
        setIsRenting(true);
        try {
            const ride = await rentScooter(scooterId);
            console.log(ride, "ridens")
            navigate(`/rent/active/${ride._id}`);
        } catch (error) {
            alert('Failed to rent scooter. Please try again.');
        } finally {
            setIsRenting(false);
        }
    };

    return (
        <div className="rent-container">
            <div className="rent-header">
                <h1>Rent a Scooter</h1>
                <button onClick={handleRentScooter} disabled={!scooterId || isRenting}>
                    {isRenting ? 'Renting...' : 'Rent Scooter'}
                </button>
            </div>

            <div className="rent-map">
                <ScooterMap setScooterId={setScooterId} />
            </div>
        </div>
    );
};

export default RentScooter;