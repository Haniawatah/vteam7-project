import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { availableScooters } from '../../hooks/rentScooters';
import { fetchChargingZone, fetchParkingZone } from '../../services/scooters';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [59.3293, 18.0686];

const ScooterZonesMap: React.FC = () => {
    const { scooters, loading: loadingScooters, error: errorScooters } = availableScooters(5000);
    const [chargingZones, setChargingZones] = useState<any[]>([]);
    const [parkingZones, setParkingZones] = useState<any[]>([]);
    const [loadingZones, setLoadingZones] = useState(true);

    useEffect(() => {
        const loadZones = async () => {
        try {
            const charging = await fetchChargingZone(); // expects [{ _id, name, zone: { position_1, position_2, ... }, elsparkcyklar }]
            const parking = await fetchParkingZone();

            // Transform zone object to array of coordinates for Polygon
            const formatZone = (zoneItem: any) => {
            const z = zoneItem.zone;
            return {
                ...zoneItem,
                coordinates: [z.position_1, z.position_2, z.position_3, z.position_4]
            };
            };

            setChargingZones(charging.map(formatZone));
            setParkingZones(parking.map(formatZone));
        } catch (error) {
            console.error('Error loading zones:', error);
        } finally {
            setLoadingZones(false);
        }
        };

        loadZones();
    }, []);

    if (loadingScooters || loadingZones) return <div>Loading map data...</div>;
    if (errorScooters) return <div>Error loading scooters</div>;

    return (
        <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: '500px', width: '100%' }}>
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
        />

        {/* Charging Zones */}
        {chargingZones.map(zone => (
            <Polygon
            key={zone._id}
            positions={zone.coordinates}
            pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.3 }}
            >
            <Popup>
                <strong>{zone.name}</strong><br />
                Scooters: {zone.elsparkcyklar?.length ?? 0}
            </Popup>
            </Polygon>
        ))}

        {/* Parking Zones */}
        {parkingZones.map(zone => (
            <Polygon
            key={zone._id}
            positions={zone.coordinates}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.3 }}
            >
            <Popup>
                <strong>{zone.name}</strong><br />
                Scooters: {zone.elsparkcyklar?.length ?? 0}
            </Popup>
            </Polygon>
        ))}

        {/* Scooters */}
        {scooters.map(scooter => (
            <Marker
            key={scooter._id}
            position={[scooter.location.lat, scooter.location.lng]}
            >
            <Popup>
                <strong>ID:</strong> {scooter.id}<br />
                <strong>Status:</strong> {scooter.status}<br />
                <strong>Battery:</strong> {Math.round(scooter.batteryLevel)}%
            </Popup>
            </Marker>
        ))}
        </MapContainer>
    );
};

export default ScooterZonesMap;
