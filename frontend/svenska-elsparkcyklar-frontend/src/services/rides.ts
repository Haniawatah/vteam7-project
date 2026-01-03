import api from './api';

const toMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const tokenHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'x-access-token': token } : {};
};

export const getActiveRide = async (rideId: string) => {
    try {
        const res = await api.get(`/rides/active/${rideId}`, {
            headers: { 'Content-Type': 'application/json', ...tokenHeader() },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error fetching active ride: ' + toMessage(error));
    }
};

export const getRideHistory = async () => {
    try {
        const res = await api.get('/rides/history', {
            headers: { 'Content-Type': 'application/json', ...tokenHeader() },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error fetching ride history: ' + toMessage(error));
    }
};

export const createRide = async (rideData: unknown) => {
    try {
        const res = await api.post('/rides', rideData, {
            headers: { 'Content-Type': 'application/json', ...tokenHeader() },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error creating ride: ' + toMessage(error));
    }
};

export const endRide = async (rideId: string) => {
    try {
        const res = await api.put(`/rides/end/${rideId}`, {}, {
            headers: { 'Content-Type': 'application/json', ...tokenHeader() },
        });
        return res.data;
    } catch (error) {
        throw new Error('Error ending ride: ' + toMessage(error));
    }
};
