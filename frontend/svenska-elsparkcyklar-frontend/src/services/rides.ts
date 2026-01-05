import api from './api';

const toMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);


export const getRidePrice = async (scooterId: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.get(`/ride/price/${scooterId}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        console.log(response, "hej")

        return response.data;
    } catch (error) {
        throw new Error('Error fetching active ride: ' + toMessage(error));
    }
};



export const getActiveRide = async (scooterId: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    console.log(token);

    try {
        const response = await api.get(`/ride/active/${scooterId}`, {
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
        const response = await api.get('/ride/history', {
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

export const endRide = async (scooterId: string, rideId: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.post(`/ride/end/${rideId}`, {
            scooterId: scooterId,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            },
        });

        return response.data;
    } catch (error) {
        throw new Error('Error ending ride: ' + toMessage(error));
    }
};


export const getRentedRides = async () => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.get(`/ride/rented`, {
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

