import React from 'react';
import ScooterMap from '../components/Map/ScooterMap';

const Home: React.FC = () => {
  return (
    <div className="container">
      <div className="card">
        <h1>Welcome to Svenska Elsparkcyklar AB</h1>

        <div style={{ height: 420 }}>
          <ScooterMap />
        </div>
      </div>
    </div>
  );
};

export default Home;