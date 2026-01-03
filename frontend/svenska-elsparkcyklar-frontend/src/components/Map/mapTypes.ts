export type MarkerType = 'scooter' | 'chargingStation' | 'parkingZone';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface MapMarker {
    id: string;
    type: MarkerType;
    position: Coordinates;
    title?: string;
}

// Single source of truth:
export type { Scooter, ScooterStatus } from '../../types';