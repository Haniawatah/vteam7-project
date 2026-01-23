import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { getSpecificRideHistory } from '../../services/rides';
import Loading from '../../components/Loading';

const UserRideHistory = () => {
    const { rideId } = useParams();
    const [rideDetails, setRideDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mapRef = useRef<LeafletMap | null>(null);

    useEffect(() => {
        if (!rideId) return;

        const loadRide = async () => {
            try {
                const data = await getSpecificRideHistory(rideId);
                setRideDetails(data);
                setError(null);
            } catch (err: any) {
                setError(err?.message ?? 'Failed to fetch ride');
            } finally {
                setLoading(false);
            }
        };

        void loadRide();
    }, [rideId]);

    if (loading) return <Loading />;
    if (error) return <div className="error">{error}</div>;
    if (!rideDetails) return <div>No ride found.</div>;

    // Gör våra markers för Start och slut pointsen
    const startPos: [number, number] = [
        rideDetails.start_location.lat,
        rideDetails.start_location.lng
    ];
    const endPos: [number, number] = [
        rideDetails.end_location.lat,
        rideDetails.end_location.lng
    ];

    return (
        <div className="container">
            <div className="card" style={{ display: 'grid', gap: 12 }}>
                <h1 style={{ margin: 0 }}>Ride Details</h1>

                <p><strong>Ride ID:</strong> {rideDetails.id}</p>
                <p><strong>Scooter ID:</strong> {rideDetails.scooterId}</p>
                <p><strong>Status:</strong> {rideDetails.status}</p>
                <p><strong>Start Time:</strong> {new Date(rideDetails.start_time).toLocaleString()}</p>
                <p><strong>End Time:</strong> {rideDetails.end_time ? new Date(rideDetails.end_time).toLocaleString() : '—'}</p>
                <p><strong>Price:</strong> ${rideDetails.price?.toFixed(2)}</p>
                <p><strong>User ID:</strong> {rideDetails.userId}</p>

                <div style={{ height: 360, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <MapContainer
                        center={startPos}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        whenCreated={(m) => { mapRef.current = m; }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                        />

                        {/* Start marker */}
                        <Marker position={startPos}>
                            <Popup>
                                Start: {rideDetails.scooterId}<br />
                                {new Date(rideDetails.start_time).toLocaleString()}
                            </Popup>
                        </Marker>

                        {/* End marker */}
                        <Marker position={endPos}>
                            <Popup>
                                End: {rideDetails.scooterId}<br />
                                {rideDetails.end_time ? new Date(rideDetails.end_time).toLocaleString() : '—'}
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default UserRideHistory;
