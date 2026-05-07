import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useScooters } from '../../hooks/useScooters';
import L from 'leaflet';

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

const ScooterMap: React.FC<Props> = ({ setScooterId, height = 420 }) => {
    const { scooters, loading, error } = useScooters(5000);

    const initialCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
    const hasLockedInitialCenter = useRef(false);

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

            <MapContainer
                center={initialCenterRef.current}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {markers}
            </MapContainer>
        </div>
    );
};

export default ScooterMap;
