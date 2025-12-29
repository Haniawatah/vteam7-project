import api from './api';

const toMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

export const getActiveRide = async (rideId: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.get(`/rides/active/${rideId}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error fetching active ride: ' + toMessage(error));
    }
};

export const getRideHistory = async () => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.get('/rides/history', {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error fetching ride history: ' + toMessage(error));
    }
};

export const createRide = async (rideData: unknown) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.post('/rides', rideData, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error creating ride: ' + toMessage(error));
    }
};

export const endRide = async (rideId: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.put(`/rides/end/${rideId}`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error ending ride: ' + toMessage(error));
    }
};
