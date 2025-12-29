import React from 'react';
import ScooterMap from '../components/Map/ScooterMap';

const Home: React.FC = () => {
    return (
        <div className="container">
            <div className="card" style={{ display: 'grid', gap: 12 }}>
                <div>
                    <h1>Welcome to Svenska Elsparkcyklar AB</h1>
                    <p>Find and rent scooters in your area!</p>
                </div>

                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <ScooterMap height={460} />
                </div>
            </div>
        </div>
    );
};

export default Home;