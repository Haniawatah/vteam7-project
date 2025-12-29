import api from './api';

const toMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

export const fetchScooters = async () => {
    let token = localStorage.getItem("token");  // Fetch the token

    console.log(token)

    try {
        const response = await api.get('/scooters', {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });
        console.log("hejsan")
        console.log(response);

        return response.data;
    } catch (error) {
        throw new Error('Error fetching scooters: ' + toMessage(error));
    }
};

export const fetchScooterData = fetchScooters; // Alias for fetchScooters

export const fetchScooterById = async (id: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.get(`/scooters/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error fetching scooter by ID: ' + toMessage(error));
    }
};

export const createScooter = async (scooterData: unknown) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.post('/scooters', scooterData, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error creating scooter: ' + toMessage(error));
    }
};

export const updateScooter = async (id: string, scooterData: unknown) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.put(`/scooters/${id}`, scooterData, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error updating scooter: ' + toMessage(error));
    }
};

export const deleteScooter = async (id: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.delete(`/scooters/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error deleting scooter: ' + toMessage(error));
    }
};

// Used by RentScooter page
export const rentScooter = async (scooterId: string) => {
    let token = localStorage.getItem("token");  // Fetch the token

    try {
        const response = await api.post('/rides', { scooterId }, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,  // Attach token here in the header
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Error renting scooter: ' + toMessage(error));
    }
};
