import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fetchScooters } from '../../services/scooters';
import { Scooter } from '../../types';
import L from 'leaflet';

type Props = {
    setScooterId?: (id: string) => void;
    height?: number | string; // UX: allow parent to control map height
};

// Custom marker icon
const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41], // Adjust the size of the marker
    iconAnchor: [12, 41], // Anchor the icon to the bottom
    popupAnchor: [1, -34], // Position of the popup
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
});

const ScooterMap: React.FC<Props> = ({ setScooterId, height = 420 }) => {
    const [scooters, setScooters] = useState<Scooter[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadScooters = async () => {
            try {
                const data = await fetchScooters();
                console.log(data); // Log data to ensure it is being fetched
                setScooters(data); // Store scooter data in the state
            } catch (error) {
                console.error('Error fetching scooter data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadScooters();
    }, []); // Empty dependency array ensures this effect runs only once (on mount)

    if (loading) return <div>Loading...</div>;

    // Utility function to extract LatLng from scooter data
    const getLatLng = (scooter: any): [number, number] => {
        console.log(scooter.position); // Log position data for debugging
        if (Array.isArray(scooter.position) && scooter.position.length === 2) {
            return [scooter.position[0], scooter.position[1]];
        }

        // Default position (fallback if position is not available)
        return [59.3293, 18.0686]; // Coordinates for Stockholm (fallback)
    };

    return (
        <MapContainer
            center={[59.3293, 18.0686]} // Default center (Stockholm)
            zoom={13} // Zoom level
            style={{ height, width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {scooters.map((scooter: any) => (
                <Marker
                    key={scooter._id} // Use _id for key to ensure unique marker
                    position={getLatLng(scooter)} // Get correct lat, lng from the scooter
                    icon={defaultIcon} // Set the custom icon here
                    eventHandlers={{
                        click: () => {
                            console.log(scooter._id); // Logs "Hello" when a marker is clicked
                            setScooterId?.(scooter._id); // Also sets the scooterId
                        },
                    }}
                >
                    <Popup>
                        <strong>Scooter ID:</strong> {scooter.name}
                        <br />
                        <strong>Status:</strong> {scooter.status}
                        <br />
                        <strong>Battery:</strong> {scooter.battery}%
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default ScooterMap;
