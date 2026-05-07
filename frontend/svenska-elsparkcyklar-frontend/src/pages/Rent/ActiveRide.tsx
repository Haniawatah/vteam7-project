import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { getActiveRide, getRidePrice, endRide } from '../../services/rides';
import Loading from '../../components/Loading';

const ActiveRide = () => {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const [rideDetails, setRideDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Leaflet-karta + "spår" (trail) för att se var scootern har rört sig
    const mapRef = useRef<LeafletMap | null>(null);
    const lastPosKeyRef = useRef<string>('');
    const [trail, setTrail] = useState<[number, number][]>([]);

    useEffect(() => {
        if (!rideId) return;

        let alive = true;

        const load = async () => {
            try {
                const data = await getActiveRide(rideId);
                if (!alive) return;
                setRideDetails(data);
                setError(null);
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? 'Failed to fetch active ride');
            } finally {
                if (alive) setLoading(false);
            }
        };

        void load();

        // Tät polling för spårning (backend tickar ungefär var 3:e sekund)
        const interval = window.setInterval(() => void load(), 1000);

        return () => {
            alive = false;
            window.clearInterval(interval);
        };
    }, [rideId]);

    useEffect(() => {
        if (!rideId) return;

        const fetchPrice = async () => {
            try {
                const data = await getRidePrice(rideId);
                setPrice(data.price);
            } catch (error: any) {
                console.error('Error fetching price:', error);
            }
        };

        fetchPrice();
        const interval = setInterval(fetchPrice, 30000);
        return () => clearInterval(interval);
    }, [rideId]);

    const onEnd = async () => {
        if (!rideDetails?._id) return;
        try {
            await endRide(rideDetails.scooterId, rideDetails._id);
            navigate('/rent/history');
        } catch (e: any) {
            alert(e?.message ?? 'Failed to end ride');
        }
    };

    const s = rideDetails?.scooter;
    const lat = Number(s?.location?.lat);
    const lng = Number(s?.location?.lng);
    const pos: [number, number] | null =
        Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;

    // Uppdatera spåret + följ scootern automatiskt
    useEffect(() => {
        if (!pos) return;

        // Följ scootern (centrera kartan) när positionen uppdateras
        if (mapRef.current) {
            mapRef.current.setView(pos, mapRef.current.getZoom(), { animate: true });
        }

        // Lägg bara till i spåret om positionen faktiskt ändrats
        const key = `${pos[0].toFixed(6)},${pos[1].toFixed(6)}`;
        if (lastPosKeyRef.current === key) return;
        lastPosKeyRef.current = key;

        setTrail((prev) => {
            // Begränsa storlek så den inte växer oändligt
            const next = [...prev, pos];
            return next.length > 300 ? next.slice(next.length - 300) : next;
        });
    }, [pos?.[0], pos?.[1]]);

    if (loading) return <Loading />;
    if (error) return <div className="error">{error}</div>;
    if (!rideDetails) return <div>No active ride found.</div>;

    return (
        <div className="container">
            <div className="card" style={{ display: 'grid', gap: 12 }}>
                <h1 style={{ margin: 0 }}>Active Ride</h1>

                <p><strong>Ride ID:</strong> {rideDetails._id}</p>
                <p><strong>Scooter ID:</strong> {rideDetails.scooterId}</p>
                <p><strong>Status:</strong> {rideDetails.status}</p>

                <div style={{ display: 'grid', gap: 6 }}>
                    <div>
                        <strong>Battery:</strong>{' '}
                        {typeof s?.batteryLevel === 'number' ? `${Math.round(s.batteryLevel)}%` : '—'}
                    </div>
                    <div><strong>Current price:</strong> {price} SEK</div>
                    <div><strong>Location:</strong> {pos ? `${pos[0].toFixed(6)}, ${pos[1].toFixed(6)}` : '—'}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => setTrail(pos ? [pos] : [])}
                        disabled={!pos}
                    >
                        Clear trail
                    </button>

                    {rideDetails.status === 'active' ? (
                        <button type="button" onClick={onEnd}>End Ride</button>
                    ) : null}
                </div>

                <div style={{ height: 360, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <MapContainer
                        center={pos ?? [59.3293, 18.0686]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        whenCreated={(m) => { mapRef.current = m; }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                        />

                        {/* Spår (trail) som visar rörelsen */}
                        {trail.length >= 2 ? (
                            <Polyline positions={trail} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }} />
                        ) : null}

                        {/* Markör: bara den scootern du hyr */}
                        {pos ? (
                            <Marker position={pos}>
                                <Popup>
                                    Scooter <strong>{rideDetails.scooterId}</strong>
                                    <br />
                                    Battery: {typeof s?.batteryLevel === 'number' ? `${Math.round(s.batteryLevel)}%` : '—'}
                                </Popup>
                            </Marker>
                        ) : null}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default ActiveRide;
