import React from 'react';
import ScooterZonesMap from '../components/Map/ZoneMap';

const ScooterMapPage: React.FC = () => {
    return (
        <div>
        <h1>Elsparkcyklar and Stations</h1>
            <ScooterZonesMap />
        </div>
    );
};

export default ScooterMapPage;
