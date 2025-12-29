import api from './api';

const toMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

export const getActiveRide = async (rideId: string) => {
    try {
        return await api.get(`/rides/active/${rideId}`);
    } catch (error) {
        throw new Error('Error fetching active ride: ' + toMessage(error));
    }
};

export const getRideHistory = async () => {
    try {
        return await api.get('/rides/history');
    } catch (error) {
        throw new Error('Error fetching ride history: ' + toMessage(error));
    }
};

export const createRide = async (rideData: unknown) => {
    try {
        return await api.post('/rides', rideData);
    } catch (error) {
        throw new Error('Error creating ride: ' + toMessage(error));
    }
};

export const endRide = async (rideId: string) => {
    try {
        return await api.put(`/rides/end/${rideId}`);
    } catch (error) {
        throw new Error('Error ending ride: ' + toMessage(error));
    }
};