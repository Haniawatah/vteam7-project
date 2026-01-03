export type ScooterStatus = 'Available' | 'InUse' | 'Maintenance' | 'Off';

export interface Scooter {
  id: string;
  batteryLevel: number;
  status: ScooterStatus;
  location: { lat: number; lng: number };
  city: string;
}