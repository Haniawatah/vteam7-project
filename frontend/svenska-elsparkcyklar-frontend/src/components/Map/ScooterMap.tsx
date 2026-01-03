import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useScooters } from '../../hooks/useScooters';

type Props = {
    setScooterId?: (id: string) => void;
    height?: number | string;
};

const DEFAULT_CENTER: [number, number] = [59.3293, 18.0686]; // Stockholm

const ScooterMap: React.FC<Props> = ({ setScooterId, height = 420 }) => {
    const { scooters, loading, error } = useScooters(5000);

    // Keep map center steady while data refreshes.
    const initialCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
    const hasLockedInitialCenter = useRef(false);

    useEffect(() => {
        if (hasLockedInitialCenter.current) return;
        const first = scooters[0];
        if (!first) return;

        initialCenterRef.current = [first.location.lat, first.location.lng];
        hasLockedInitialCenter.current = true;
    }, [scooters]);

    // Hooks must run every render (no early returns before hooks).
    const markers = useMemo(
        () =>
            scooters.map((s) => (
                <Marker
                    // Update marker key when it moves
                    key={`${s.id}:${s.location.lat}:${s.location.lng}`}
                    position={[s.location.lat, s.location.lng]}
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
            {loading ? (
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}>
                    <small style={{ background: '#fff', border: '1px solid #eee', padding: '4px 8px', borderRadius: 8 }}>
                        Loading…
                    </small>
                </div>
            ) : null}

            {error ? (
                <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1000 }}>
                    <small style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: 8 }}>
                        Map error: {error}
                    </small>
                </div>
            ) : null}

            <MapContainer center={initialCenterRef.current} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {markers}
            </MapContainer>
        </div>
    );
};

export default ScooterMap;
