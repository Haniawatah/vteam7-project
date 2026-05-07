import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { useScooters } from '../../hooks/useScooters';
import L from 'leaflet';
import { fetchChargingZone, fetchParkingZone } from '../../services/scooters';

type Props = {
    setScooterId?: (id: string) => void;
    height?: number | string;
};


//Fixa färger till ikonerna på kartan, (hittat från git repot https://github.com/pointhi/leaflet-color-markers)
const Icon = (status: string) => {
    //Vi har Charging = RÖD, InUse Orange, Annars blå (standard)
    const color = status === 'Charging' ? 'red' :
                    status === 'InUse' ? 'orange' : 'blue';

    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
};


const DEFAULT_CENTER: [number, number] = [59.3293, 18.0686]; // Standard: Stockholm

const ZoneMap: React.FC<Props> = ({ setScooterId, height = 420 }) => {
    const { scooters, loading, error } = useScooters(5000);

    const initialCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
    const hasLockedInitialCenter = useRef(false);


    const [chargingZones, setChargingZones] = useState<any[]>([]);
    const [parkingZones, setParkingZones] = useState<any[]>([]);


    useEffect(() => {
        const loadZones = async () => {
        try {
            const charging = await fetchChargingZone();
            const parking = await fetchParkingZone();

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
        }
        };

        loadZones();
    }, []);

    useEffect(() => {
        // Lås startpositionen en gång (så kartan inte hoppar vid polling)
        if (hasLockedInitialCenter.current) return;
        const first = scooters[0];
        if (!first) return;

        initialCenterRef.current = [first.location.lat, first.location.lng];
        hasLockedInitialCenter.current = true;
    }, [scooters]);

    const markers = useMemo(
        () =>
            scooters.map((s) => (
                <Marker
                    key={`${s.id}:${s.location.lat}:${s.location.lng}`}
                    position={[s.location.lat, s.location.lng]}
                    icon={Icon(s.status)}
                    eventHandlers={{ click: () => setScooterId?.(s.id) }}
                >
                    <Popup>
                        <strong>ID:</strong> {s.id}
                        <br />
                        <strong>Status:</strong> {s.status}
                        <br />
                        <strong>Battery:</strong> {Math.round(s.batteryLevel)}%
                        <br />
                        <strong>City:</strong> {s.city || '—'}
                    </Popup>
                </Marker>
            )),
        [scooters, setScooterId]
    );

    return (
        <div style={{ position: 'relative', height, width: '100%' }}>
            {loading && (
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}>
                    <small style={{ background: '#fff', border: '1px solid #eee', padding: '4px 8px', borderRadius: 8 }}>
                        Loading…
                    </small>
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1000 }}>
                    <small style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: 8 }}>
                        Map error: {error}
                    </small>
                </div>
            )}

            <MapContainer center={initialCenterRef.current} zoom={13} style={{ height: '100%', width: '100%' }} >

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

                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {markers}
            </MapContainer>
        </div>
    );
};

export default ZoneMap;
