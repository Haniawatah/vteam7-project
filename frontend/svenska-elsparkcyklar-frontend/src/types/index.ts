export interface Scooter {
    id: string;
    model: string;
    // support both shapes (some components expect flat coords)
    latitude?: number;
    longitude?: number;
    location?: {
        latitude: number;
        longitude: number;
    };
    status: 'available' | 'rented' | 'maintenance';
}

export interface User {
    id: string;
    name: string;
    email: string;
    balance: number;
    rides: Ride[];
}

export interface Ride {
    id: string;
    scooterId: string;
    userId?: string;
    startTime?: string | Date;
    endTime?: string | Date;
    // fields used by RideHistory UI
    date?: string | Date;
    duration?: number;
    cost?: number;
    status?: 'active' | 'ended';
}

export interface Payment {
    id: string;
    userId: string;
    amount: number;
    date: Date;
    method: 'credit_card' | 'paypal' | 'other';
}

export interface Report {
    id: string;
    user: string;
    rideDuration: number;
    date: string | Date;
}