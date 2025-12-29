import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fetchScooters } from '../../services/scooters';
import { Scooter } from '../../types';

type Props = {
    setScooterId?: (id: string) => void;
    height?: number | string; // UX: allow parent to control map height
};

const ScooterMap: React.FC<Props> = ({ setScooterId, height = 420 }) => {
    const [scooters, setScooters] = useState<Scooter[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadScooters = async () => {
            try {
                const data = await fetchScooters();
                setScooters(data);
            } catch (error) {
                console.error('Error fetching scooter data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadScooters();
    }, []);

    if (loading) return <div>Loading...</div>;

    const getLatLng = (s: any): [number, number] => {
        if (typeof s?.latitude === 'number' && typeof s?.longitude === 'number') return [s.latitude, s.longitude];
        if (typeof s?.location?.latitude === 'number' && typeof s?.location?.longitude === 'number')
            return [s.location.latitude, s.location.longitude];
        return [59.3293, 18.0686];
    };

    return (
        <MapContainer
            center={[59.3293, 18.0686]}
            zoom={13}
            style={{ height, width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {scooters.map((scooter: any) => (
                <Marker
                    key={scooter.id}
                    position={getLatLng(scooter)}
                    eventHandlers={{
                        click: () => setScooterId?.(scooter.id),
                    }}
                >
                    <Popup>
                        Scooter ID: {scooter.id}
                        <br />
                        Status: {scooter.status}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default ScooterMap;