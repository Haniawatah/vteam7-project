import React from 'react';
import ScooterZonesMap from '../components/Map/ZoneMap';

const ScooterMapPage: React.FC = () => {
    return (
        <div>
        <h1>Elsparkcyklar & Zones</h1>
        <p>Green = Charging Stations, Blue = Parking Zones</p>
        <ScooterZonesMap />
        </div>
    );
};

export default ScooterMapPage;
